import { LiveBadge } from "@/components/pulse-mark";
import { formatRelativeShort } from "@/lib/pulse/format";
import { useOnline } from "@/lib/pulse/use-online";
import type { FeedStats, MessageView } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function DashboardHero({
  stats,
  connected,
  latest,
}: {
  stats: FeedStats;
  connected: boolean;
  latest?: MessageView;
}) {
  const online = useOnline();
  return (
    <section className="rounded-xl bg-panel px-4 py-4 shadow-hairline sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-dim">
            Огляд
          </p>
          <h1 className="mt-1 text-base font-semibold tracking-tight text-ink">
            Наживо по Києву
          </h1>
          <p className="mt-0.5 truncate text-sm text-quiet">
            {latest
              ? `Останнє · ${formatRelativeShort(latest.publishedAt)} · ${latest.source.title}`
              : "Відкриті Telegram-канали зі списку джерел"}
          </p>
        </div>
        <LiveBadge connected={connected} online={online} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Сьогодні" value={String(stats.today)} />
        <Stat label="За добу" value={String(stats.last24h)} />
        <Stat label="Джерела" value={String(stats.sourceCount)} />
        <Stat
          label="Telegram"
          value={stats.scraperOk ? "мережа" : "резерв"}
          quiet={!stats.scraperOk}
        />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  quiet,
}: {
  label: string;
  value: string;
  quiet?: boolean;
}) {
  return (
    <div className="rounded-sm bg-raised px-3 py-2.5">
      <dt className="text-2xs font-medium uppercase tracking-wider text-dim">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-mono text-lg font-medium tabular-nums tracking-tight",
          quiet ? "text-quiet" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
