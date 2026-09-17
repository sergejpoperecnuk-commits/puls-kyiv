import { format, isToday, isYesterday, parseISO, startOfDay } from "date-fns";
import { uk } from "date-fns/locale";
import type { Category } from "./types";
import { CATEGORY_LABEL } from "./sources";

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function formatClock(value: string | Date): string {
  return format(toDate(value), "HH:mm");
}

export function formatDayKey(value: string | Date): string {
  const d = toDate(value);
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  return format(startOfDay(d), "yyyy-MM-dd");
}

export function formatDayLabel(key: string): string {
  if (key === "today") return "Сьогодні";
  if (key === "yesterday") return "Вчора";
  return format(parseISO(key), "dd MMMM", { locale: uk }).toLocaleUpperCase("uk-UA");
}

export function formatRelativeShort(value: string | Date, now = new Date()): string {
  const d = toDate(value);
  const diff = now.getTime() - d.getTime();
  const mins = Math.max(0, Math.round(diff / 60_000));
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв`;
  if (isToday(d)) return formatClock(d);
  if (isYesterday(d)) return `вчора, ${formatClock(d)}`;
  return format(d, "d MMM, HH:mm", { locale: uk });
}

export function formatFullStamp(value: string | Date): string {
  const d = toDate(value);
  if (isToday(d)) return `${formatClock(d)} • сьогодні`;
  if (isYesterday(d)) return `${formatClock(d)} • вчора`;
  return format(d, "d MMMM, HH:mm", { locale: uk });
}

export function formatHourLabel(value: string | Date): string {
  return format(toDate(value), "HH:00");
}

export function categoryLabel(category: Category | string): string {
  return CATEGORY_LABEL[category] ?? category;
}

export function groupByDay<T extends { publishedAt: string }>(
  items: T[],
): { key: string; label: string; items: T[] }[] {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const key = formatDayKey(item.publishedAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: formatDayLabel(key), items: [item] });
  }
  return groups;
}
