import { getSql } from "@/lib/db";
import { ALLOWED_SOURCES, SOURCE_BY_ID } from "./sources";
import { seedRows } from "./seed-data";
import { lastLiveAt } from "./realtime.server";
import type {
  Category,
  FeedPage,
  FeedStats,
  MessageView,
  SourceStats,
} from "./types";

const SEED_VERSION = 4;

type MessageRow = {
  id: string;
  source_id: string;
  telegram_id: string;
  body: string;
  published_at: string | Date;
  telegram_url: string;
  media_url: string | null;
  media_type: string;
  category: string;
  ingested_at: string | Date;
  source_title: string;
  source_username: string;
  source_initials: string;
  source_category: string;
  source_region: string;
};

function iso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

export function mapMessage(row: MessageRow): MessageView {
  return {
    id: row.id,
    sourceId: row.source_id,
    telegramId: row.telegram_id,
    text: row.body,
    publishedAt: iso(row.published_at),
    telegramUrl: row.telegram_url,
    mediaUrl: row.media_url,
    mediaType: row.media_type === "photo" ? "photo" : "none",
    category: (row.category as Category) ?? "official",
    ingestedAt: iso(row.ingested_at),
    source: {
      title: row.source_title,
      username: row.source_username,
      initials: row.source_initials,
      category: (row.source_category as Category) ?? "official",
      region: row.source_region === "oblast" ? "oblast" : "kyiv",
    },
  };
}

const MESSAGE_SELECT = `
  select
    m.id, m.source_id, m.telegram_id, m.body, m.published_at, m.telegram_url,
    m.media_url, m.media_type, m.category, m.ingested_at,
    s.title as source_title, s.username as source_username,
    s.initials as source_initials, s.category as source_category,
    s.region as source_region
  from messages m
  join sources s on s.id = m.source_id
`;

let seedPromise: Promise<void> | null = null;

export async function ensurePulseReady(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const sql = await getSql();
      const allowedIds = ALLOWED_SOURCES.map((s) => s.id);
      for (const source of ALLOWED_SOURCES) {
        await sql`
          insert into sources (id, username, title, description, category, region, initials, enabled)
          values (
            ${source.id}, ${source.username}, ${source.title}, ${source.description},
            ${source.category}, ${source.region}, ${source.initials}, ${source.enabled}
          )
          on conflict (id) do update set
            username = excluded.username,
            title = excluded.title,
            description = excluded.description,
            category = excluded.category,
            region = excluded.region,
            initials = excluded.initials,
            enabled = excluded.enabled
        `;
      }
      if (allowedIds.length > 0) {
        await sql.query(`delete from messages where not (source_id = any($1::text[]))`, [
          allowedIds,
        ]);
        await sql.query(`delete from sources where not (id = any($1::text[]))`, [allowedIds]);
      }
      await sql`delete from messages where telegram_id like 'live%'`;
      const real = await sql`
        select 1 as ok from messages
        where telegram_id not like 'seed-%' and telegram_id not like 'live%'
        limit 1
      `;
      if (real.length > 0) {
        await sql`delete from messages where telegram_id like 'seed-%'`;
      }
      const state = await sql<{ seed_version: number | null }>`
        select seed_version from ingest_state where id = 'default'
      `;
      const version = asNumber(state[0]?.seed_version);
      if (version < SEED_VERSION) {
        await sql`delete from messages where telegram_id not like 'live%'`
        const rows = seedRows();
        for (const message of rows.messages) {
          await sql`
            insert into messages (
              id, source_id, telegram_id, body, published_at, telegram_url,
              media_url, media_type, category
            )
            values (
              ${message.id}, ${message.sourceId}, ${message.telegramId}, ${message.text},
              ${message.publishedAt}, ${message.telegramUrl}, ${message.mediaUrl},
              ${message.mediaType}, ${message.category}
            )
            on conflict (id) do update set
              body = excluded.body,
              published_at = excluded.published_at,
              media_url = excluded.media_url,
              media_type = excluded.media_type,
              category = excluded.category
          `;
        }
        await sql`
          insert into ingest_state (id, last_ingest_at, last_live_at, live_index, scraper_ok, seed_version)
          values ('default', now(), now(), 0, false, ${SEED_VERSION})
          on conflict (id) do update set seed_version = ${SEED_VERSION}
        `;
      }
      void import("./ingest.server")
        .then((m) => m.scrapeAllowedSources())
        .catch((err) => {
          console.error("[pulse] initial scrape failed", err);
        });
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  await seedPromise;
}

export async function insertMessage(input: {
  sourceId: string;
  telegramId: string;
  text: string;
  publishedAt: string;
  telegramUrl: string;
  mediaUrl?: string | null;
  mediaType?: "photo" | "none";
  category?: Category;
}): Promise<MessageView | null> {
  await ensurePulseReady();
  const source = SOURCE_BY_ID[input.sourceId];
  if (!source) return null;
  const id = `${input.sourceId}:${input.telegramId}`;
  const sql = await getSql();
  const inserted = await sql<{ id: string }>`
    insert into messages (
      id, source_id, telegram_id, body, published_at, telegram_url,
      media_url, media_type, category
    )
    values (
      ${id}, ${input.sourceId}, ${input.telegramId}, ${input.text},
      ${input.publishedAt}, ${input.telegramUrl}, ${input.mediaUrl ?? null},
      ${input.mediaType ?? (input.mediaUrl ? "photo" : "none")},
      ${input.category ?? source.category}
    )
    on conflict (source_id, telegram_id) do nothing
    returning id
  `;
  if (inserted.length === 0) return null;
  await sql`
    insert into ingest_state (id, last_live_at)
    values ('default', ${input.publishedAt})
    on conflict (id) do update set last_live_at = excluded.last_live_at
  `;
  return getMessage(id);
}

export async function getMessage(id: string): Promise<MessageView | null> {
  await ensurePulseReady();
  const sql = await getSql();
  const rows = await sql.query<MessageRow>(`${MESSAGE_SELECT} where m.id = $1`, [id]);
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function listMessages(opts: {
  cursor?: string;
  limit?: number;
  sourceIds?: string[];
  query?: string;
  category?: string;
}): Promise<FeedPage> {
  await ensurePulseReady();
  const sql = await getSql();
  const limit = Math.min(Math.max(opts.limit ?? 28, 1), 80);
  const params: unknown[] = [];
  const where: string[] = [];

  if (opts.sourceIds && opts.sourceIds.length > 0) {
    const placeholders = opts.sourceIds.map((_, i) => `$${params.length + i + 1}`);
    params.push(...opts.sourceIds);
    where.push(`m.source_id in (${placeholders.join(", ")})`);
  }
  if (opts.category) {
    params.push(opts.category);
    where.push(`m.category = $${params.length}`);
  }
  if (opts.query && opts.query.trim()) {
    const q = opts.query.trim().replace(/[%_\\]/g, " ").slice(0, 80);
    params.push(`%${q}%`);
    where.push(`(m.body ilike $${params.length} or s.title ilike $${params.length})`);
  }
  if (opts.cursor) {
    const [ts, id] = opts.cursor.split("|");
    if (ts && id) {
      params.push(ts, id);
      where.push(
        `(m.published_at, m.id) < ($${params.length - 1}::timestamptz, $${params.length})`,
      );
    }
  }

  const clause = where.length ? `where ${where.join(" and ")}` : "";
  params.push(limit + 1);
  const rows = await sql.query<MessageRow>(
    `${MESSAGE_SELECT} ${clause} order by m.published_at desc, m.id desc limit $${params.length}`,
    params,
  );
  const extra = rows.length > limit;
  const slice = extra ? rows.slice(0, limit) : rows;
  const last = slice[slice.length - 1];
  return {
    messages: slice.map(mapMessage),
    nextCursor: extra && last ? `${iso(last.published_at)}|${last.id}` : null,
  };
}

export async function listSources(): Promise<SourceStats[]> {
  await ensurePulseReady();
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    username: string;
    title: string;
    description: string;
    category: string;
    region: string;
    initials: string;
    enabled: boolean;
    message_count: number;
    last_published_at: string | Date | null;
  }>`
    select
      s.id, s.username, s.title, s.description, s.category, s.region,
      s.initials, s.enabled,
      count(m.id)::int as message_count,
      max(m.published_at) as last_published_at
    from sources s
    left join messages m on m.source_id = s.id
    group by s.id
    order by max(m.published_at) desc nulls last, s.title
  `;
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    region: row.region === "oblast" ? "oblast" : "kyiv",
    initials: row.initials,
    enabled: Boolean(row.enabled),
    messageCount: asNumber(row.message_count),
    lastPublishedAt: row.last_published_at ? iso(row.last_published_at) : null,
  }));
}

export async function getStats(): Promise<FeedStats> {
  await ensurePulseReady();
  const sql = await getSql();
  const [totals] = await sql<{
    today: number;
    last24h: number;
    total: number;
    source_count: number;
  }>`
    select
      count(*) filter (where published_at >= date_trunc('day', now()))::int as today,
      count(*) filter (where published_at >= now() - interval '24 hours')::int as last24h,
      count(*)::int as total,
      (select count(*)::int from sources) as source_count
  from messages
  `;
  const hours = await sql<{ hour: string | Date; count: number }>`
    select date_trunc('hour', published_at) as hour, count(*)::int as count
    from messages
    where published_at >= now() - interval '24 hours'
    group by 1
    order by 1
  `;
  const ingest = await sql<{ scraper_ok: boolean; last_live_at: string | Date | null }>`
    select scraper_ok, last_live_at from ingest_state where id = 'default'
  `;
  const hourMap = new Map<string, number>();
  for (const row of hours) {
    const key = iso(row.hour).slice(0, 13);
    hourMap.set(key, asNumber(row.count));
  }
  const buckets: { hour: string; count: number }[] = [];
  const start = Date.now() - 23 * 3600_000;
  for (let i = 0; i < 24; i += 1) {
    const d = new Date(start + i * 3600_000);
    d.setMinutes(0, 0, 0);
    const key = d.toISOString().slice(0, 13);
    buckets.push({ hour: d.toISOString(), count: hourMap.get(key) ?? 0 });
  }
  return {
    today: asNumber(totals?.today),
    last24h: asNumber(totals?.last24h),
    total: asNumber(totals?.total),
    sourceCount: asNumber(totals?.source_count),
    lastLiveAt: lastLiveAt() ?? (ingest[0]?.last_live_at ? iso(ingest[0].last_live_at) : null),
    scraperOk: Boolean(ingest[0]?.scraper_ok),
    hours: buckets,
  };
}

export async function nextLiveIndex(): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ live_index: number }>`
    update ingest_state
    set live_index = live_index + 1
    where id = 'default'
    returning live_index
  `;
  if (rows[0]) return asNumber(rows[0].live_index);
  await sql`
    insert into ingest_state (id, live_index) values ('default', 1)
    on conflict (id) do nothing
  `;
  return 1;
}

export async function markScraper(ok: boolean): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into ingest_state (id, last_ingest_at, scraper_ok)
    values ('default', now(), ${ok})
    on conflict (id) do update set last_ingest_at = now(), scraper_ok = excluded.scraper_ok
  `;
}

export async function deleteSeedMessages(): Promise<void> {
  const sql = await getSql();
  await sql`delete from messages where telegram_id like 'seed-%'`;
}
