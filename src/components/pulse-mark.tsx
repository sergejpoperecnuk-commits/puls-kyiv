import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function PulseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" className="fill-raised" />
      <path
        d="M6.5 17.5h3.6l2.2-7 3.8 13 2.6-6h6.8"
        fill="none"
        className="stroke-signal"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LiveBadge({
  connected,
  online = true,
}: {
  connected: boolean;
  online?: boolean;
}) {
  // First paint always matches SSR ("Наживо"). Real status applies after mount.
  const [net, setNet] = useState(true);
  const [live, setLive] = useState(true);

  useEffect(() => {
    setNet(online);
    setLive(connected);
  }, [online, connected]);

  const label = !net ? "Офлайн" : live ? "Наживо" : "З'єднання";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-quiet shadow-hairline">
      <span
        className={cn(
          "size-1.5 rounded-full",
          !net ? "bg-dim" : live ? "bg-signal live-dot" : "bg-warn",
        )}
      />
      {label}
    </span>
  );
}
