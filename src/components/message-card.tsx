import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { categoryLabel, formatFullStamp } from "@/lib/pulse/format";
import type { MessageView } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

function highlight(text: string, query?: string) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-xs bg-signal/20 text-ink">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  );
}

export function MessageCard({
  message,
  fresh,
  compact,
  query,
}: {
  message: MessageView;
  fresh?: boolean;
  compact?: boolean;
  query?: string;
}) {
  const [open, setOpen] = useState(false);
  const long = message.text.length > 280;
  const shown = !open && compact && long ? `${message.text.slice(0, 240).trim()}…` : message.text;
  const isAlert = message.category === "alert";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl bg-panel p-4 shadow-hairline",
        "transition-[box-shadow,background-color] duration-150 ease-out",
        "hover:shadow-hairline-hover",
        fresh && "msg-enter",
        isAlert && "ring-1 ring-danger/25",
        compact ? "p-3.5" : "p-4",
      )}
    >
      <header className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md font-mono text-xs font-medium text-ink shadow-hairline",
            isAlert ? "bg-danger/15 text-danger" : "bg-raised",
          )}
          aria-hidden="true"
        >
          {message.source.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight text-ink">
              {message.source.title}
            </h3>
            {fresh ? (
              <span className="rounded-full bg-signal/15 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-signal">
                нове
              </span>
            ) : (
              <span
                className={cn(
                  "hidden rounded-full px-2 py-0.5 text-2xs font-medium uppercase tracking-wider sm:inline",
                  isAlert && "bg-danger/10 text-danger",
                  message.category === "utilities" && "bg-warn/10 text-warn",
                  !isAlert &&
                    message.category !== "utilities" &&
                    "bg-raised text-quiet",
                )}
              >
                {categoryLabel(message.category)}
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-dim">
            {formatFullStamp(message.publishedAt)}
            {message.source.region === "oblast" ? " · область" : ""}
          </p>
        </div>
      </header>

      <p
        className={cn(
          "mt-3 text-pretty text-sm leading-relaxed text-ink/90",
          compact && !open && "line-clamp-4",
        )}
      >
        {highlight(shown, query)}
      </p>

      {long && compact ? (
        <button
          type="button"
          className="mt-1.5 py-2 text-xs font-medium text-quiet hover:text-ink"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Згорнути" : "Читати далі"}
        </button>
      ) : null}

      {message.mediaUrl ? (
        <div className="mt-3 overflow-hidden rounded-md">
          <img
            src={message.mediaUrl}
            alt=""
            className="aspect-video w-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
          />
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={message.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-quiet transition-colors duration-150 hover:text-signal"
        >
          Відкрити в Telegram
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
        <span className="truncate font-mono text-2xs text-dim">@{message.source.username}</span>
      </div>
    </article>
  );
}
