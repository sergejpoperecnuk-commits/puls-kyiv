import type { SourceRecord } from "./types";

export const ALLOWED_SOURCES: SourceRecord[] = [
  { id: "war-monitor", username: "war_monitor", title: "monitor", description: "Відкритий моніторинг повітряної обстановки. Не офіційний канал.", category: "alert", region: "oblast", initials: "MO", enabled: true },
  { id: "kyiv-nebo", username: "kyiv_nebo", title: "Київське небо", description: "Інформування киян про загрози з відкритих джерел.", category: "alert", region: "kyiv", initials: "КН", enabled: true },
  { id: "ppo-kiev", username: "ppo_kiev", title: "ППО Київ", description: "Сповіщення про загрозу в Києві та області.", category: "alert", region: "kyiv", initials: "ПП", enabled: true },
  { id: "va-kyiv", username: "VA_Kyiv", title: "КМВА", description: "Офіційний канал Київської міської військової адміністрації.", category: "official", region: "kyiv", initials: "ВА", enabled: true },
  { id: "kyiv-oda", username: "kyivoda", title: "Київська ОВА", description: "Офіційний канал Київської ОВА.", category: "official", region: "oblast", initials: "ОД", enabled: true }
];

export const SOURCE_BY_ID = Object.fromEntries(ALLOWED_SOURCES.map((s) => [s.id, s]));
export const SOURCE_BY_USERNAME = Object.fromEntries(ALLOWED_SOURCES.map((s) => [s.username.toLowerCase(), s]));
