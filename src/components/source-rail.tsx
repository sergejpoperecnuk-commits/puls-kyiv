import { ActivityChart, ActivityLegend } from "@/components/activity-chart";
import { CATEGORY_LABEL } from "@/lib/pulse/sources";
import { formatRelativeShort } from "@/lib/pulse/format";
import type { Category, FeedStats, SourceStats } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export const CATS: Category[] = [
  "alert",
  "official",
  "utilities",
  "transport",
  "safety",
  "weather",
];

export function SourceRail({
  sources,
  selected,
  onToggle,
  onClear,
  category,
  onCategory,
  stats,
}: {
  sources: SourceStats[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  category?: string;
  onCategory: (value?: string) => void;
  stats: FeedStats;
}) {
  const allOn = selected.length === 0;

  return (
    <aside className="hidden h-full w-80 shrink-0 flex-col border-l border-hairline bg-panel xl:flex">
      <div className="px-5 pt-6 pb-4">
        <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-dim">
          Сьогодні
        </p>
        <p className="mt-1 font-mono text-3xl font-medium tabular-nums tracking-tight text-ink">
          {stats.today}
        </p>
        <p className="mt-1 text-sm text-quiet">
          {stats.last24h} повідомлень за добу
        </p>
        <div className="mt-4">
          <ActivityChart hours={stats.hours} />
          <ActivityLegend hours={stats.hours} />
        </div>
      </div>

      <div className="px-5 pb-4">
        <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-dim">
          Тема
        </p>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={!category} onClick={() => onCategory(undefined)} label="Усі" />
          {CATS.filter((cat) => sources.some((s) => s.category === cat)).map((cat) => (
            <FilterChip
              key={cat}
              active={category === cat}
              onClick={() => onCategory(category === cat ? undefined : cat)}
              label={CATEGORY_LABEL[cat]}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-2">
        <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-dim">
          Джерела
        </p>
        <button
          type="button"
          className="text-xs text-quiet hover:text-ink"
          onClick={() => {
            if (!allOn) onClear();
          }}
        >
          {allOn ? "усі активні" : "скинути"}
        </button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {sources.map((source) => {
          const on = allOn || selected.includes(source.id);
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onToggle(source.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150",
                on ? "hover:bg-raised" : "opacity-45 hover:opacity-70",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-raised font-mono text-2xs font-medium shadow-hairline">
                {source.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {source.title}
                </span>
                <span className="block truncate font-mono text-2xs text-dim">
                  {source.lastPublishedAt
                    ? formatRelativeShort(source.lastPublishedAt)
                    : "немає"}
                  {" · "}
                  {source.messageCount}
                </span>
              </span>
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  on ? "bg-signal" : "bg-dim",
                )}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3 text-xs font-medium transition-[background-color,color] duration-150",
        active ? "bg-ink text-canvas" : "bg-raised text-quiet hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
