import { useNavigate } from "@tanstack/react-router";
import { Filter, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "vaul";
import { AppShell } from "@/components/app-shell";
import { DashboardHero } from "@/components/dashboard-hero";
import { FeedList, FeedSkeleton } from "@/components/feed-list";
import { CATS, FilterChip, SourceRail } from "@/components/source-rail";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABEL } from "@/lib/pulse/sources";
import { formatRelativeShort } from "@/lib/pulse/format";
import { useLiveFeed, useSources, useStats } from "@/lib/pulse/use-live-feed";
import { usePrefs } from "@/lib/pulse/prefs";
import type { FeedPage, FeedSearch, FeedStats, SourceStats } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function LiveWorkspace({
  variant,
  search,
  searchFrom,
  initial,
}: {
  variant: "dashboard" | "reader";
  search: FeedSearch;
  searchFrom: "/" | "/feed";
  initial: { stats: FeedStats; sources: SourceStats[]; feed: FeedPage };
}) {
  const navigate = useNavigate({ from: searchFrom });
  const compact = usePrefs((s) => s.compact);
  const [jump, setJump] = useState(0);
  const [draft, setDraft] = useState(search.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    setDraft(search.q ?? "");
  }, [search.q]);

  const selected = useMemo(
    () => (search.src ? search.src.split(",").filter(Boolean) : []),
    [search.src],
  );

  const live = useLiveFeed(
    {
      sourceIds: selected.length ? selected : undefined,
      query: search.q,
      category: search.cat,
    },
    initial.feed,
  );
  const sourcesQuery = useSources();
  const statsQuery = useStats();
  const sources = sourcesQuery.data ?? initial.sources;
  const stats = statsQuery.data ?? initial.stats;
  const latest = live.messages[0];

  function patch(next: FeedSearch) {
    void navigate({
      search: {
        q: next.q || undefined,
        cat: next.cat || undefined,
        src: next.src || undefined,
      },
      replace: true,
    });
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = searchRef.current;
      if (draft === (current.q ?? "")) return;
      void navigate({
        search: {
          q: draft || undefined,
          cat: current.cat || undefined,
          src: current.src || undefined,
        },
        replace: true,
      });
    }, 280);
    return () => window.clearTimeout(handle);
  }, [draft, navigate]);

  function toggleSource(id: string) {
    let next: string[];
    if (selected.length === 0) next = [id];
    else if (selected.includes(id)) next = selected.filter((item) => item !== id);
    else next = [...selected, id];
    if (next.length === 0 || next.length === sources.length) {
      patch({ ...search, src: undefined });
    } else {
      patch({ ...search, src: next.join(",") });
    }
  }

  const header = (
    <div className="flex w-full items-center gap-2">
      {variant === "dashboard" ? (
        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="text-sm font-semibold tracking-tight">Наживо</p>
          <p className="truncate text-xs text-dim">
            {latest
              ? `Останнє · ${formatRelativeShort(latest.publishedAt)} · ${latest.source.title}`
              : "Стрічка з відкритих каналів"}
          </p>
        </div>
      ) : null}
      <div className={cn("relative min-w-0", variant === "dashboard" ? "flex-1 lg:max-w-sm" : "flex-1")}>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
        <Input
          value={draft}
          placeholder="Пошук у стрічці"
          className="pl-9"
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-lg bg-raised text-quiet xl:hidden"
        aria-label="Фільтри"
        onClick={() => setFiltersOpen(true)}
      >
        <Filter className="size-4" />
      </button>
    </div>
  );

  const pending = live.isPending && live.messages.length === 0;

  return (
    <AppShell
      connected={live.connected}
      header={header}
      rail={
        <SourceRail
          sources={sources}
          selected={selected}
          onToggle={toggleSource}
          onClear={() => patch({ ...search, src: undefined })}
          category={search.cat}
          onCategory={(cat) => patch({ ...search, cat })}
          stats={stats}
        />
      }
    >
      <div className="relative h-full">
        {live.unseen > 0 ? (
          <button
            type="button"
            className="absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-signal-fg shadow-lg"
            onClick={() => {
              setJump((n) => n + 1);
              live.clearUnseen();
              live.markAtTop(true);
            }}
          >
            {live.unseen} нові
          </button>
        ) : null}
        {pending ? (
          <FeedSkeleton />
        ) : (
          <FeedList
            messages={live.messages}
            freshIds={live.freshIds}
            compact={compact}
            query={search.q}
            onAtTop={live.markAtTop}
            hasMore={live.hasNextPage}
            loadingMore={live.isFetchingNextPage}
            onLoadMore={() => {
              if (live.hasNextPage && !live.isFetchingNextPage) void live.fetchNextPage();
            }}
            jumpToken={jump}
            leading={
              variant === "dashboard" && !search.q && !search.cat && !search.src ? (
                <DashboardHero stats={stats} connected={live.connected} latest={latest} />
              ) : undefined
            }
          />
        )}
      </div>

      <Drawer.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-canvas/60" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-panel pb-[env(safe-area-inset-bottom)] shadow-hairline">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-hairline-strong" />
            <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <Drawer.Title className="text-sm font-semibold">Фільтри</Drawer.Title>
              {search.cat || selected.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-quiet hover:text-ink"
                  onClick={() => patch({ ...search, cat: undefined, src: undefined })}
                >
                  Скинути
                </button>
              ) : null}
            </div>
              <p className="mt-4 text-2xs font-semibold uppercase tracking-[0.16em] text-dim">
                Тема
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <FilterChip
                  active={!search.cat}
                  onClick={() => patch({ ...search, cat: undefined })}
                  label="Усі"
                />
                {CATS.filter((cat) => sources.some((s) => s.category === cat)).map((cat) => (
                  <FilterChip
                    key={cat}
                    active={search.cat === cat}
                    onClick={() =>
                      patch({ ...search, cat: search.cat === cat ? undefined : cat })
                    }
                    label={CATEGORY_LABEL[cat]}
                  />
                ))}
              </div>
              <p className="mt-5 text-2xs font-semibold uppercase tracking-[0.16em] text-dim">
                Джерела
              </p>
              <div className="mt-2 flex flex-col">
                {sources.map((source) => {
                  const on = selected.length === 0 || selected.includes(source.id);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleSource(source.id)}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-lg px-1 text-left",
                        !on && "opacity-45",
                      )}
                    >
                      <span className="flex size-9 items-center justify-center rounded-md bg-raised font-mono text-2xs">
                        {source.initials}
                      </span>
                      <span className="flex-1 text-sm">{source.title}</span>
                      <span className={cn("size-1.5 rounded-full", on ? "bg-signal" : "bg-dim")} />
                    </button>
                  );
                })}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </AppShell>
  );
}
