import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { groupByDay } from "@/lib/pulse/format";
import type { MessageView } from "@/lib/pulse/types";
import { MessageCard } from "./message-card";
import { cn } from "@/lib/utils";

export function FeedSkeleton() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 pt-3 lg:px-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-panel p-4 shadow-hairline">
          <div className="flex gap-3">
            <div className="skeleton size-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-36 rounded-sm" />
              <div className="skeleton h-2.5 w-24 rounded-sm" />
            </div>
          </div>
          <div className="skeleton mt-4 h-3 w-full rounded-sm" />
          <div className="skeleton mt-2 h-3 w-4/5 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

export function FeedList({
  messages,
  freshIds,
  compact,
  query,
  onAtTop,
  hasMore,
  onLoadMore,
  loadingMore,
  jumpToken,
  leading,
}: {
  messages: MessageView[];
  freshIds: Set<string>;
  compact?: boolean;
  query?: string;
  onAtTop?: (value: boolean) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  jumpToken?: number;
  leading?: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const onScroll = () => onAtTop?.(root.scrollTop < 48);
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener("scroll", onScroll);
  }, [onAtTop]);

  useEffect(() => {
    if (jumpToken == null) return;
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [jumpToken]);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: scroller.current, rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, messages.length]);

  const groups = groupByDay(messages);

  return (
    <div
      ref={scroller}
      className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-28 pt-3 lg:px-6 lg:pb-8"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {leading}
        {groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-3">
            <div className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-canvas/90 px-1 py-2 backdrop-blur-sm">
              <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-quiet">
                {group.label}
              </h2>
              <span className="h-px flex-1 bg-hairline" />
            </div>
            {group.items.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                fresh={freshIds.has(message.id)}
                compact={compact}
                query={query}
              />
            ))}
          </section>
        ))}

        {messages.length === 0 ? (
          <div className="rounded-xl bg-panel px-5 py-12 text-center shadow-hairline">
            <p className="text-sm font-medium text-ink">Немає повідомлень</p>
            <p className="mt-1 text-sm text-quiet">
              Змініть фільтри або скиньте пошук, щоб побачити стрічку.
            </p>
          </div>
        ) : null}

        <div ref={sentinel} />
        {hasMore ? (
          <p className={cn("pb-4 text-center text-xs text-dim", loadingMore && "text-quiet")}>
            {loadingMore ? "Завантаження історії…" : "Гортайте для історії"}
          </p>
        ) : messages.length > 0 ? (
          <p className="pb-4 text-center text-xs text-dim">Початок збереженої стрічки</p>
        ) : null}
      </div>
    </div>
  );
}
