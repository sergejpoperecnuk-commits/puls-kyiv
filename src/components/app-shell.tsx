import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radio,
  Search,
  Settings,
  Layers,
} from "lucide-react";
import type { ReactNode } from "react";
import { LiveBadge, PulseMark } from "./pulse-mark";
import { useOnline } from "@/lib/pulse/use-online";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Головна", icon: LayoutDashboard, short: "Головна" },
  { to: "/feed", label: "Стрічка", icon: Radio, short: "Стрічка" },
  { to: "/sources", label: "Джерела", icon: Layers, short: "Джерела" },
  { to: "/search", label: "Пошук", icon: Search, short: "Пошук" },
  { to: "/settings", label: "Налаштування", icon: Settings, short: "Ще" },
] as const;

export function AppShell({
  children,
  rail,
  connected,
  header,
}: {
  children: ReactNode;
  rail?: ReactNode;
  connected?: boolean;
  header?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-ink pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-hairline bg-panel lg:flex">
        <div className="flex items-center gap-3 px-5 pt-6 pb-8">
          <PulseMark />
          <div>
            <p className="text-sm font-semibold tracking-tight text-ink">Пульс Києва</p>
            <p className="text-2xs text-dim">Цивільний моніторинг</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-raised text-ink shadow-hairline"
                    : "text-quiet hover:bg-raised/70 hover:text-ink",
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-5">
          <LiveBadge connected={Boolean(connected)} online={online} />
          <p className="mt-3 text-2xs leading-relaxed text-dim">
            Відкриті канали зі списку джерел. Без розрахунку координат і цілей.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-hairline bg-panel/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:min-h-16 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
            <PulseMark className="size-7" />
            <span className="truncate text-sm font-semibold">Пульс Києва</span>
          </div>
          <div className="hidden min-w-0 flex-1 lg:flex lg:items-center">{header}</div>
          <div className="lg:hidden">
            <LiveBadge connected={Boolean(connected)} online={online} />
          </div>
        </header>
        {!online ? (
          <div className="border-b border-hairline bg-raised px-4 py-2 text-center text-xs text-quiet">
            Немає мережі · показано збережену стрічку
          </div>
        ) : null}
        {header ? (
          <div className="border-b border-hairline px-4 py-2 lg:hidden">{header}</div>
        ) : null}
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1">{children}</main>
          {rail}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-hairline bg-panel/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-md lg:hidden">
        {NAV.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-2xs font-medium",
                active ? "text-ink" : "text-dim",
              )}
            >
              <Icon className={cn("size-5", active && "text-signal")} strokeWidth={1.8} />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
