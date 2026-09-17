export const CATEGORIES = ["alert", "official", "utilities", "transport", "safety", "weather"] as const;
export type Category = (typeof CATEGORIES)[number];
export const REGIONS = ["kyiv", "oblast"] as const;
export type Region = (typeof REGIONS)[number];
export type SourceRecord = {
  id: string; username: string; title: string; description: string;
  category: Category; region: Region; initials: string; enabled: boolean;
};
