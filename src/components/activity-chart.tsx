import { formatClock, formatHourLabel } from "@/lib/pulse/format";
import { cn } from "@/lib/utils";

export function ActivityChart({
  hours,
}: {
  hours: { hour: string; count: number }[];
}) {
  const max = Math.max(1, ...hours.map((h) => h.count));

  return (
    <div className="flex h-14 items-end gap-0.5" aria-hidden="true">
      {hours.map((bucket) => {
        const empty = bucket.count === 0;
        const ratio = bucket.count / max;
        return (
          <div
            key={bucket.hour}
            title={`${formatHourLabel(bucket.hour)} · ${bucket.count}`}
            className={cn("flex-1 rounded-sm", empty ? "bg-raised" : "bg-signal")}
            style={{ height: empty ? 3 : Math.max(8, ratio * 56) }}
          />
        );
      })}
    </div>
  );
}

export function ActivityLegend({
  hours,
}: {
  hours: { hour: string; count: number }[];
}) {
  const first = hours[0];
  const last = hours[hours.length - 1];
  if (!first || !last) return null;
  return (
    <div className="mt-2 flex justify-between font-mono text-2xs text-dim">
      <span>{formatClock(first.hour)}</span>
      <span>24 год</span>
      <span>{formatClock(last.hour)}</span>
    </div>
  );
}
