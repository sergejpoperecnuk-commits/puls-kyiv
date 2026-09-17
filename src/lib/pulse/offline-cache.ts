import type { FeedPage, FeedStats, MessageView, SourceStats } from "./types";

const KEY = "kyiv-pulse-offline";

export type OfflineSnapshot = {
  feed: FeedPage;
  sources: SourceStats[];
  stats: FeedStats;
  savedAt: string;
};

function emptyStats(): FeedStats {
  return {
    today: 0,
    last24h: 0,
    total: 0,
    sourceCount: 0,
    lastLiveAt: null,
    scraperOk: false,
    hours: [],
  };
}

export function readOfflineSnapshot(): OfflineSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveOfflineSnapshot(part: Partial<OfflineSnapshot>): void {
  if (typeof localStorage === "undefined") return;
  try {
    const prev = readOfflineSnapshot() ?? {
      feed: { messages: [], nextCursor: null },
      sources: [],
      stats: emptyStats(),
      savedAt: new Date().toISOString(),
    };
    const next: OfflineSnapshot = {
      feed: part.feed ?? prev.feed,
      sources: part.sources ?? prev.sources,
      stats: part.stats ?? prev.stats,
      savedAt: new Date().toISOString(),
    };
    if (next.feed.messages.length > 80) {
      next.feed = {
        messages: next.feed.messages.slice(0, 80),
        nextCursor: next.feed.nextCursor,
      };
    }
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function mergeLiveMessage(message: MessageView): void {
  const prev = readOfflineSnapshot();
  if (!prev) {
    saveOfflineSnapshot({
      feed: { messages: [message], nextCursor: null },
    });
    return;
  }
  if (prev.feed.messages.some((item) => item.id === message.id)) return;
  saveOfflineSnapshot({
    feed: {
      messages: [message, ...prev.feed.messages],
      nextCursor: prev.feed.nextCursor,
    },
  });
}
