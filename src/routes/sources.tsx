import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { fetchSources } from "@/lib/pulse/api";
import { CATEGORY_LABEL, REGION_LABEL } from "@/lib/pulse/sources";
import { formatRelativeShort } from "@/lib/pulse/format";
import { useLiveFeed, useSources } from "@/lib/pulse/use-live-feed";
import { usePrefs } from "@/lib/pulse/prefs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sources")({
  loader: () => fetchSources(),
  component: SourcesPage,
});

function SourcesPage() {
  const initial = Route.useLoaderData();
  const live = useLiveFeed({});
  const query = useSources();
  const sources = query.data ?? initial;
  const mutedIds = usePrefs((s) => s.mutedIds);
  const toggleMuted = usePrefs((s) => s.toggleMuted);

  return (
    <AppShell connected={live.connected} header={<Header />}>
      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-28 pt-5 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-quiet">
            Дозволений список відкритих каналів. Вимкнені ховаються зі стрічки на цьому
            пристрої. Надішліть ще посилання — додамо.
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {sources.map((source) => {
              const on = !mutedIds.includes(source.id);
              return (
                <li
                  key={source.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl bg-panel p-4 shadow-hairline",
                    !on && "opacity-55",
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-raised font-mono text-xs font-medium">
                    {source.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/feed"
                        search={{ src: source.id }}
                        className="truncate text-sm font-semibold hover:text-signal"
                      >
                        {source.title}
                      </Link>
                      <span className="rounded-full bg-raised px-2 py-0.5 text-2xs uppercase tracking-wider text-quiet">
                        {CATEGORY_LABEL[source.category]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-quiet">{source.description}</p>
                    <p className="mt-1 font-mono text-2xs text-dim">
                      @{source.username} · {REGION_LABEL[source.region]} · {source.messageCount}{" "}
                      · {source.lastPublishedAt ? formatRelativeShort(source.lastPublishedAt) : "немає"}
                    </p>
                  </div>
                  <Switch
                    checked={on}
                    onChange={() => toggleMuted(source.id)}
                    label={on ? `Вимкнути ${source.title}` : `Увімкнути ${source.title}`}
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-center text-sm text-dim">
            <Link to="/feed" className="text-quiet hover:text-ink">
              Повернутися до стрічки
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Header() {
  return (
    <div>
      <p className="text-sm font-semibold">Джерела</p>
      <p className="hidden text-xs text-dim lg:block">Дозволений список каналів</p>
    </div>
  );
}
