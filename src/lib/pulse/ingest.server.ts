import { ALLOWED_SOURCES, SOURCE_BY_ID, SOURCE_BY_USERNAME } from "./sources";
import { LIVE_TEMPLATES, telegramUrl } from "./seed-data";
import {
  ensurePulseReady,
  insertMessage,
  markScraper,
  nextLiveIndex,
  deleteSeedMessages,
} from "./store.server";
import { lastLiveAt, publishMessage } from "./realtime.server";
import type { Category, MessageView } from "./types";

const g = globalThis as typeof globalThis & {
  __pulseIngestLock__?: boolean;
  __pulseLiveTimer__?: ReturnType<typeof setInterval>;
  __pulseScrapeTimer__?: ReturnType<typeof setInterval>;
};

const AMP = "\u0026";

function decodeEntities(value: string): string {
  return value
    .split(`${AMP}nbsp;`)
    .join(" ")
    .split(`${AMP}amp;`)
    .join("&")
    .split(`${AMP}quot;`)
    .join('"')
    .split(`${AMP}#39;`)
    .join("'")
    .split(`${AMP}apos;`)
    .join("'")
    .split(`${AMP}lt;`)
    .join("<")
    .split(`${AMP}gt;`)
    .join(">")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type ParsedPost = {
  username: string;
  telegramId: string;
  text: string;
  publishedAt: string;
  mediaUrl: string | null;
};

function parseTelegramHtml(html: string): ParsedPost[] {
  const blocks = html.split("tgme_widget_message_wrap");
  const posts: ParsedPost[] = [];
  for (const block of blocks) {
    const post = block.match(/data-post="([^/]+)\/(\d+)"/);
    if (!post) continue;
    const username = post[1];
    const telegramId = post[2];
    const textMatch = block.match(
      /tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/,
    );
    const timeMatch = block.match(/datetime="([^"]+)"/);
    const photoMatch = block.match(
      /tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/,
    );
    const text = decodeEntities(textMatch?.[1] ?? "");
    if (!text || !timeMatch) continue;
    posts.push({
      username,
      telegramId,
      text,
      publishedAt: new Date(timeMatch[1]).toISOString(),
      mediaUrl: photoMatch?.[1] ?? null,
    });
  }
  return posts;
}

async function scrapeSource(username: string): Promise<ParsedPost[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://t.me/s/${username}`, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KyivPulse/1.0; civic-feed aggregator)",
        Accept: "text/html",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    return parseTelegramHtml(html);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function ingestParsed(posts: ParsedPost[]): Promise<number> {
  let added = 0;
  for (const post of posts) {
    const source = SOURCE_BY_USERNAME[post.username.toLowerCase()];
    if (!source) continue;
    const message = await insertMessage({
      sourceId: source.id,
      telegramId: post.telegramId,
      text: post.text,
      publishedAt: post.publishedAt,
      telegramUrl: telegramUrl(source.id, post.telegramId),
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaUrl ? "photo" : "none",
      category: source.category,
    });
    if (message) {
      const age = Date.now() - new Date(message.publishedAt).getTime();
      if (age < 3 * 60_000) publishMessage(message);
      added += 1;
    }
  }
  return added;
}

export async function scrapeAllowedSources(): Promise<{ ok: boolean; added: number }> {
  await ensurePulseReady();
  let added = 0;
  let ok = false;
  for (const source of ALLOWED_SOURCES) {
    const posts = await scrapeSource(source.username);
    if (posts.length > 0) ok = true;
    added += await ingestParsed(posts);
  }
  await markScraper(ok);
  if (ok) await deleteSeedMessages();
  return { ok, added };
}

export async function emitLiveTick(): Promise<MessageView | null> {
  await ensurePulseReady();
  const index = await nextLiveIndex();
  const template = LIVE_TEMPLATES[(index - 1) % LIVE_TEMPLATES.length];
  if (!template) return null;
  const source = SOURCE_BY_ID[template.sourceId];
  if (!source) return null;
  const telegramId = `live${Date.now().toString(36)}${index}`;
  const message = await insertMessage({
    sourceId: template.sourceId,
    telegramId,
    text: template.text,
    publishedAt: new Date().toISOString(),
    telegramUrl: telegramUrl(template.sourceId, telegramId),
    mediaUrl: template.mediaUrl ?? null,
    mediaType: template.mediaUrl ? "photo" : "none",
    category: (template.category as Category) ?? source.category,
  });
  if (message) publishMessage(message);
  return message;
}

export type TelegramUpdate = {
  channel_post?: {
    message_id: number;
    date: number;
    text?: string;
    caption?: string;
    chat?: { username?: string; title?: string };
    photo?: { file_id: string }[];
  };
  message?: {
    message_id: number;
    date: number;
    text?: string;
    caption?: string;
    chat?: { username?: string; title?: string };
    photo?: { file_id: string }[];
    sender_chat?: { username?: string };
  };
};

export async function ingestTelegramUpdate(
  update: TelegramUpdate,
): Promise<MessageView | null> {
  const post = update.channel_post ?? update.message;
  if (!post) return null;
  const username = (
    post.chat?.username ??
    update.message?.sender_chat?.username ??
    ""
  ).toLowerCase();
  const source = SOURCE_BY_USERNAME[username];
  if (!source) return null;
  const text = (post.text ?? post.caption ?? "").trim();
  if (!text) return null;
  const message = await insertMessage({
    sourceId: source.id,
    telegramId: String(post.message_id),
    text,
    publishedAt: new Date(post.date * 1000).toISOString(),
    telegramUrl: telegramUrl(source.id, String(post.message_id)),
    mediaType: post.photo?.length ? "photo" : "none",
    category: source.category,
  });
  if (message) publishMessage(message);
  return message;
}

export function startIngestLoop(): void {
  if (g.__pulseLiveTimer__) {
    clearInterval(g.__pulseLiveTimer__);
    g.__pulseLiveTimer__ = undefined;
  }
  if (g.__pulseIngestLock__) return;
  g.__pulseIngestLock__ = true;
  void ensurePulseReady().catch((err) => {
    console.error("[pulse] seed failed", err);
  });
  g.__pulseScrapeTimer__ = setInterval(() => {
    void scrapeAllowedSources().catch((err) => {
      console.error("[pulse] scrape failed", err);
    });
  }, 90_000);
  void scrapeAllowedSources().catch(() => undefined);
}
