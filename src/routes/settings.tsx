import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PwaInstallCard } from "@/components/pwa-install";
import { Switch } from "@/components/ui/switch";
import { useLiveFeed, useStats } from "@/lib/pulse/use-live-feed";
import { usePrefs } from "@/lib/pulse/prefs";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const live = useLiveFeed({});
  const stats = useStats();
  const compact = usePrefs((s) => s.compact);
  const sound = usePrefs((s) => s.sound);
  const setCompact = usePrefs((s) => s.setCompact);
  const setSound = usePrefs((s) => s.setSound);
  const channel =
    !live.online ? "офлайн" : live.transport === "ws" ? "WebSocket" : live.transport === "sse" ? "SSE" : "з'єднання";

  return (
    <AppShell connected={live.connected} header={<Header />}>
      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-28 pt-5 lg:px-8">
        <div className="mx-auto flex max-w-xl flex-col gap-3">
          <Row
            title="Компактні картки"
            hint="Менше повітря, текст обрізається до чотирьох рядків."
            control={
              <Switch checked={compact} onChange={setCompact} label="Компактні картки" />
            }
          />
          <Row
            title="Звук нових повідомлень"
            hint="Короткий сигнал, коли з’являється нова картка."
            control={<Switch checked={sound} onChange={setSound} label="Звук" />}
          />

          <section className="mt-4 rounded-xl bg-panel p-4 shadow-hairline">
            <h2 className="text-sm font-semibold">Канал оновлення</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-dim">Статус</dt>
                <dd className="mt-0.5 font-medium">
                  {live.online ? (live.connected ? "Наживо" : "З'єднання") : "Офлайн"}
                </dd>
              </div>
              <div>
                <dt className="text-dim">Транспорт</dt>
                <dd className="mt-0.5 font-medium">{channel}</dd>
              </div>
              <div>
                <dt className="text-dim">Повідомлень сьогодні</dt>
                <dd className="mt-0.5 font-mono tabular-nums">{stats.data?.today ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-dim">Публічний Telegram</dt>
                <dd className="mt-0.5 font-medium">
                  {stats.data?.scraperOk ? "підключено" : "резервна стрічка"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-quiet">
              Нові картки йдуть WebSocket-каналом без перезавантаження. Якщо проксі не
              пропускає сокет — автоматично вмикається запасний SSE. Без інтернету нові
              Telegram-повідомлення не надходять, залишається збережена стрічка.
            </p>
          </section>

          <PwaInstallCard />

          <section className="rounded-xl bg-panel p-4 shadow-hairline">
            <h2 className="text-sm font-semibold">Про стрічку</h2>
            <p className="mt-2 text-sm leading-relaxed text-quiet">
              Пульс Києва читає відкриті канали зі сторінки «Джерела». Текст іде як у Telegram,
              без карт і без розрахунку цілей.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-quiet">
              Застосунок не визначає координат, траєкторій і не прогнозує переміщення військових
              цілей. Це моніторинг цивільної інформації.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Header() {
  return (
    <div>
      <p className="text-sm font-semibold">Налаштування</p>
      <p className="hidden text-xs text-dim lg:block">Вигляд, звук і канал</p>
    </div>
  );
}

function Row({
  title,
  hint,
  control,
}: {
  title: string;
  hint: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-panel p-4 shadow-hairline">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-quiet">{hint}</p>
      </div>
      {control}
    </div>
  );
}
