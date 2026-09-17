import type { SourceRecord } from "./types";

/**
 * Allowlist of public Telegram sources.
 * Ingest refuses anything not on this list.
 */
export const ALLOWED_SOURCES: SourceRecord[] = [
  {
    id: "war-monitor",
    username: "war_monitor",
    title: "monitor",
    description: "Відкритий моніторинг повітряної обстановки. Не офіційний канал.",
    category: "alert",
    region: "oblast",
    initials: "MO",
    enabled: true,
  },
  {
    id: "kyiv-nebo",
    username: "kyiv_nebo",
    title: "Київське небо",
    description: "Інформування киян про загрози з відкритих джерел. Не офіційний канал.",
    category: "alert",
    region: "kyiv",
    initials: "КН",
    enabled: true,
  },
  {
    id: "ppo-kiev",
    username: "ppo_kiev",
    title: "ППО Київ",
    description: "Сповіщення про загрозу в Києві та області. Не офіційний канал.",
    category: "alert",
    region: "kyiv",
    initials: "ПП",
    enabled: true,
  },
  {
    id: "air-alarm-kyiv",
    username: "airAlarm_Kyiv",
    title: "Повітряна тривога Київ",
    description: "Інформація з відкритих джерел про повітряну тривогу в Києві.",
    category: "alert",
    region: "kyiv",
    initials: "ПТ",
    enabled: true,
  },
  {
    id: "kyiv-inform",
    username: "kievinform_ua1",
    title: "Київ ІНФО",
    description: "Оперативні сповіщення про загрози на Київщині. Не офіційний канал.",
    category: "alert",
    region: "kyiv",
    initials: "КІ",
    enabled: true,
  },
  {
    id: "monitoring-war",
    username: "monitoringwar",
    title: "monitorwar",
    description: "Сповіщення про ракетні та безпілотні загрози. OSINT, не офіційний канал.",
    category: "alert",
    region: "oblast",
    initials: "MW",
    enabled: true,
  },
  {
    id: "kyiv-alarm",
    username: "KyivAlarm",
    title: "Київ Моніторинг",
    description: "Моніторинг повітряної небезпеки для Києва. Не офіційний канал.",
    category: "alert",
    region: "kyiv",
    initials: "КА",
    enabled: true,
  },
  {
    id: "va-kyiv",
    username: "VA_Kyiv",
    title: "КМВА",
    description: "Офіційний канал Київської міської військової адміністрації.",
    category: "official",
    region: "kyiv",
    initials: "ВА",
    enabled: true,
  },
  {
    id: "kyiv-oda",
    username: "kyivoda",
    title: "Київська ОВА",
    description: "Офіційний канал Київської обласної військової адміністрації.",
    category: "official",
    region: "oblast",
    initials: "ОД",
    enabled: true,
  },
];

export const SOURCE_BY_ID = Object.fromEntries(
  ALLOWED_SOURCES.map((s) => [s.id, s]),
) as Record<string, SourceRecord>;

export const SOURCE_BY_USERNAME = Object.fromEntries(
  ALLOWED_SOURCES.map((s) => [s.username.toLowerCase(), s]),
) as Record<string, SourceRecord>;

export const CATEGORY_LABEL: Record<string, string> = {
  alert: "Тривога",
  official: "Офіційне",
  utilities: "Комунальні",
  transport: "Транспорт",
  safety: "Безпека",
  weather: "Погода",
};

export const REGION_LABEL: Record<string, string> = {
  kyiv: "Київ",
  oblast: "Київська область",
};
