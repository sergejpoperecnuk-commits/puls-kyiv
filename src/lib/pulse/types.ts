export const CATEGORIES = [
  "alert",
  "official",
  "utilities",
  "transport",
  "safety",
  "weather",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const REGIONS = ["kyiv", "oblast"] as const;
export type Region = (typeof REGIONS)[number];

export type FeedSearch = { q?: string; cat?: string; src?: string };

export type SourceRecord = {
  id: string;
  username: string;
  title: string;
  description: string;
  category: Category;
  region: Region;
  initials: string;
  enabled: boolean;
};

export type MessageView = {
  id: string;
  sourceId: string;
  telegramId: string;
  text: string;
  publishedAt: string;
  telegramUrl: string;
  mediaUrl: string | null;
  mediaType: "photo" | "none";
  category: Category;
  ingestedAt: string;
  source: {
    title: string;
    username: string;
    initials: string;
    category: Category;
    region: Region;
  };
};

export type SourceStats = SourceRecord & {
  messageCount: number;
  lastPublishedAt: string | null;
};

export type FeedPage = {
  messages: MessageView[];
  nextCursor: string | null;
};

export type FeedStats = {
  today: number;
  last24h: number;
  total: number;
  sourceCount: number;
  lastLiveAt: string | null;
  scraperOk: boolean;
  hours: { hour: string; count: number }[];
};

export type LiveEvent =
  | { type: "hello"; at: string }
  | { type: "message"; message: MessageView }
  | { type: "ping"; at: string };
