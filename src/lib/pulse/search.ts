import type { FeedSearch } from "./types";

export function parseFeedSearch(search: Record<string, unknown>): FeedSearch {
  return {
    q: typeof search.q === "string" ? search.q : undefined,
    cat: typeof search.cat === "string" ? search.cat : undefined,
    src: typeof search.src === "string" ? search.src : undefined,
  };
}
