import { ALLOWED_SOURCES, SOURCE_BY_ID } from "./sources";
import type { Category } from "./types";

export type SeedMessage = {
  sourceId: string;
  telegramId: string;
  text: string;
  minutesAgo: number;
  mediaUrl?: string;
  category?: Category;
};

/**
 * Historical feed placeholders. Times are offsets from "now" so day grouping
 * stays correct after every preview restart. Real posts replace these once
 * the public Telegram pages are scraped.
 */
export const SEED_MESSAGES: SeedMessage[] = [
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-1",
    minutesAgo: 4,
    text: "Наразі без фіксації пусків. Стежте за офіційними сигналами тривоги. Інформація з відкритих джерел і не є офіційною.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-1",
    minutesAgo: 9,
    text: "Моніторинг повітряної обстановки. Залишайтеся біля укриття, доки немає офіційного відбою. Не поширюйте неперевірені повідомлення.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-2",
    minutesAgo: 22,
    text: "Очікуємо на відбій. Канал збирає відкриті джерела і не замінює ДСНС чи «Київ Цифровий».",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-2",
    minutesAgo: 41,
    text: "Оновлення моніторингу: слідкуйте за офіційними каналами цивільного захисту. Застосунок не рахує координати й не прогнозує цілі.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-3",
    minutesAgo: 78,
    text: "Нагадування: під час тривоги — укриття, не ліфт. Після відбою перевіряйте офіційні джерела, перш ніж виходити.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-3",
    minutesAgo: 125,
    text: "Канал публікує відкриті сповіщення. Це не штаб і не офіційна тривога — орієнтир для цивільних.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-4",
    minutesAgo: 190,
    text: "Тиша в ефірі не означає відбій. Чекайте сигнал у застосунку «Київ Цифровий» або від ДСНС.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-4",
    minutesAgo: 260,
    text: "Коротке зведення: залишайтеся на зв’язку з офіційними каналами. Не фіксуйте і не поширюйте місця вибухів.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-5",
    minutesAgo: 420,
    text: "Якщо тривога активна — тримайтеся подалі від вікон. Інформація каналу не є командою ППО.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-5",
    minutesAgo: 640,
    text: "Моніторинг триває. Нових відкритих відміток немає. Бережіть себе.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-6",
    minutesAgo: 980,
    text: "Вчора: після відбою перевіряйте, чи немає повторної тривоги, перш ніж планувати поїздки.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-6",
    minutesAgo: 1320,
    text: "Нічне зведення з відкритих джерел. Офіційний статус тривоги — лише ДСНС / Київ Цифровий.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-7",
    minutesAgo: 1680,
    text: "Канал для киян. Не офіційний. Не замінює систему оповіщення.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-7",
    minutesAgo: 2100,
    text: "Денне вікно без нових відкритих сповіщень. Стежте за сиренами й офіційними ботами.",
  },
  {
    sourceId: "kyiv-nebo",
    telegramId: "seed-kn-8",
    minutesAgo: 2600,
    text: "Якщо чуєте сирену — укриття. Повідомлення каналу можуть запізнюватися відносно офіційних.",
  },
  {
    sourceId: "war-monitor",
    telegramId: "seed-wm-8",
    minutesAgo: 3180,
    text: "Архів: моніторинг повітряної обстановки з відкритих джерел. Без карт і прорахунків цілей.",
  },
];

export type LiveTemplate = {
  sourceId: string;
  text: string;
  mediaUrl?: string;
  category?: Category;
};

export const LIVE_TEMPLATES: LiveTemplate[] = [
  {
    sourceId: "kyiv-nebo",
    text: "Очікуємо на відбій. Залишайтеся в укритті, доки немає офіційного сигналу. Канал збирає відкриті джерела і не замінює ДСНС.",
    category: "alert",
  },
  {
    sourceId: "war-monitor",
    text: "Оновлення моніторингу: нових відкритих відміток по Києву немає. Тримайте зв’язок із офіційними каналами цивільного захисту.",
    category: "alert",
  },
  {
    sourceId: "kyiv-nebo",
    text: "Наразі без фіксації пусків. Інформація не офіційна — перевіряйте «Київ Цифровий».",
    category: "alert",
  },
  {
    sourceId: "war-monitor",
    text: "Моніторинг триває. Не поширюйте неперевірені повідомлення і не знімайте місце подій.",
    category: "alert",
  },
];

export function telegramUrl(sourceId: string, telegramId: string): string {
  const source = SOURCE_BY_ID[sourceId];
  const username = source?.username ?? sourceId;
  return `https://t.me/${username}/${telegramId}`;
}

export function seedRows(now = Date.now()) {
  return {
    sources: ALLOWED_SOURCES,
    messages: SEED_MESSAGES.map((m) => {
      const source = SOURCE_BY_ID[m.sourceId];
      return {
        id: `${m.sourceId}:${m.telegramId}`,
        sourceId: m.sourceId,
        telegramId: m.telegramId,
        text: m.text,
        publishedAt: new Date(now - m.minutesAgo * 60_000).toISOString(),
        telegramUrl: telegramUrl(m.sourceId, m.telegramId),
        mediaUrl: m.mediaUrl ?? null,
        mediaType: m.mediaUrl ? ("photo" as const) : ("none" as const),
        category: m.category ?? source?.category ?? "alert",
      };
    }),
  };
}
