import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FeedList, FeedSkeleton } from "@/components/feed-list";
import { Input } from "@/components/ui/input";
import { fetchMessages } from "@/lib/pulse/api";
import { useLiveFeed } from "@/lib/pulse/use-live-feed";
import { usePrefs } from "@/lib/pulse/prefs";

type SearchParams = { q?: string };

const RECENTS_KEY = "kyiv-pulse-search-recents";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => {
    if (!deps.q) return { feed: { messages: [], nextCursor: null as string | null } };
    return { feed: await fetchMessages({ data: { query: deps.q, limit: 40 } }) };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const initial = Route.useLoaderData();
  const navigate = useNavigate({ from: "/search" });
  const compact = usePrefs((s) => s.compact);
  const live = useLiveFeed({ query: q }, q ? initial.feed : undefined);
  const [draft, setDraft] = useState(q ?? "");
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setDraft(q ?? "");
  }, [q]);

  function remember(term: string) {
    const next = [term, ...recents.filter((item) => item !== term)].slice(0, 8);
    setRecents(next);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function submit(term: string) {
    const value = term.trim();
    if (value) remember(value);
    void navigate({ search: { q: value || undefined }, replace: true });
  }

  const pending = Boolean(q) && live.isPending && live.messages.length === 0;
  const messages = q ? live.messages : [];

  return (
    <AppShell
      connected={live.connected}
      header={
        <form
          className="relative w-full"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
          <Input
            value={draft}
            placeholder="Текст, адреса, джерело"
            className="pr-10 pl-9"
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
          {draft ? (
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center text-dim hover:text-ink"
              aria-label="Очистити"
              onClick={() => {
                setDraft("");
                submit("");
              }}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </form>
      }
    >
      {q ? (
        pending ? (
          <FeedSkeleton />
        ) : (
          <FeedList
            messages={messages}
            freshIds={live.freshIds}
            compact={compact}
            query={q}
            hasMore={live.hasNextPage}
            loadingMore={live.isFetchingNextPage}
            onLoadMore={() => {
              if (live.hasNextPage && !live.isFetchingNextPage) void live.fetchNextPage();
            }}
          />
        )
      ) : (
        <div className="px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-xl">
            <p className="text-sm text-quiet">
              Шукайте за текстом повідомлення або назвою джерела. Історія зберігається лише на
              цьому пристрої.
            </p>
            {recents.length ? (
              <ul className="mt-5 flex flex-col gap-1">
                {recents.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-raised"
                      onClick={() => submit(term)}
                    >
                      <Clock className="size-4 text-dim" />
                      <span className="text-sm">{term}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 text-sm text-dim">Поки немає збережених запитів.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
