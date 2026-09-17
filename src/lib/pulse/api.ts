import { createServerFn } from "@tanstack/react-start";
import { getStats, listMessages, listSources } from "./store.server";
import { startIngestLoop } from "./ingest.server";
import type { FeedSearch } from "./types";

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length ? items : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export const fetchMessages = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    return {
      cursor: asString(data.cursor),
      limit: asNumber(data.limit),
      sourceIds: asStringArray(data.sourceIds),
      query: asString(data.query),
      category: asString(data.category),
    };
  })
  .handler(async ({ data }) => {
    startIngestLoop();
    return listMessages(data);
  });

export const fetchSources = createServerFn({ method: "GET" }).handler(async () => {
  startIngestLoop();
  return listSources();
});

export const fetchStats = createServerFn({ method: "GET" }).handler(async () => {
  startIngestLoop();
  return getStats();
});

export async function loadFeedWorkspace(search: FeedSearch) {
  const sourceIds = search.src ? search.src.split(",").filter(Boolean) : undefined;
  const [stats, sources, feed] = await Promise.all([
    fetchStats(),
    fetchSources(),
    fetchMessages({
      data: {
        limit: 28,
        query: search.q,
        category: search.cat,
        sourceIds,
      },
    }),
  ]);
  return { stats, sources, feed };
}
