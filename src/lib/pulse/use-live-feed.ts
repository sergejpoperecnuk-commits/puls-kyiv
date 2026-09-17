import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMessages, fetchSources, fetchStats } from "./api";
import {
  mergeLiveMessage,
  readOfflineSnapshot,
  saveOfflineSnapshot,
  type OfflineSnapshot,
} from "./offline-cache";
import { usePrefs } from "./prefs";
import type { FeedPage, LiveEvent, MessageView } from "./types";
import { useOnline } from "./use-online";

export type FeedFilters = {
  sourceIds?: string[];
  query?: string;
  category?: string;
};

export type LiveTransport = "ws" | "sse" | null;

function matches(message: MessageView, filters: FeedFilters, mutedIds: string[]): boolean {
  if (mutedIds.includes(message.sourceId)) return false;
  if (filters.sourceIds?.length && !filters.sourceIds.includes(message.sourceId)) {
    return false;
  }
  if (filters.category && message.category !== filters.category) return false;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const hay = `${message.text} ${message.source.title}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function playTick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 740;
    gain.gain.value = 0.03;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* ignore autoplay */
  }
}

function useOfflineSnapshot() {
  const [snap, setSnap] = useState<OfflineSnapshot | null>(null);
  useEffect(() => {
    setSnap(readOfflineSnapshot());
  }, []);
  return snap;
}

export function useSources() {
  const snap = useOfflineSnapshot();
  return useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const data = await fetchSources();
      saveOfflineSnapshot({ sources: data });
      return data;
    },
    placeholderData: snap?.sources,
    retry: 1,
    networkMode: "online",
  });
}

export function useStats() {
  const online = useOnline();
  const snap = useOfflineSnapshot();
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const data = await fetchStats();
      saveOfflineSnapshot({ stats: data });
      return data;
    },
    placeholderData: snap?.stats,
    refetchInterval: online ? 12_000 : false,
    retry: 1,
    networkMode: "online",
    enabled: true,
  });
}

export function useLiveFeed(filters: FeedFilters, initialPage?: FeedPage) {
  const queryClient = useQueryClient();
  const online = useOnline();
  const snap = useOfflineSnapshot();
  const mutedIds = usePrefs((s) => s.mutedIds);
  const sound = usePrefs((s) => s.sound);
  const [connected, setConnected] = useState(true);
  const [transport, setTransport] = useState<LiveTransport>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [unseen, setUnseen] = useState(0);
  const atTopRef = useRef(true);
  const filtersRef = useRef(filters);
  const mutedRef = useRef(mutedIds);
  const soundRef = useRef(sound);
  filtersRef.current = filters;
  mutedRef.current = mutedIds;
  soundRef.current = sound;

  const queryKey = ["feed", filters.sourceIds ?? [], filters.query ?? "", filters.category ?? ""] as const;
  const unfiltered =
    !filters.sourceIds?.length && !filters.query && !filters.category;
  const offlinePage = unfiltered ? snap?.feed : undefined;

  const feed = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const page = await fetchMessages({
        data: {
          cursor: pageParam,
          limit: 28,
          sourceIds: filters.sourceIds,
          query: filters.query,
          category: filters.category,
        },
      });
      if (!pageParam && unfiltered) {
        saveOfflineSnapshot({ feed: page });
      }
      return page;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [undefined] }
      : undefined,
    placeholderData: !initialPage && offlinePage
      ? { pages: [offlinePage], pageParams: [undefined] }
      : undefined,
    retry: 1,
    networkMode: "online",
  });

  const messages = useMemo(() => {
    const seen = new Set<string>();
    const list: MessageView[] = [];
    for (const page of feed.data?.pages ?? []) {
      for (const message of page.messages) {
        if (seen.has(message.id) || mutedIds.includes(message.sourceId)) continue;
        seen.add(message.id);
        list.push(message);
      }
    }
    return list;
  }, [feed.data, mutedIds]);

  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    let closed = false;
    let socket: WebSocket | null = null;
    let source: EventSource | null = null;
    let fallbackTimer: number | undefined;
    let retryTimer: number | undefined;
    let pingTimer: number | undefined;
    let using: LiveTransport = null;

    const ingest = (message: MessageView) => {
      mergeLiveMessage(message);
      if (!matches(message, filtersRef.current, mutedRef.current)) return;
      const key = queryKeyRef.current;
      queryClient.setQueryData<{ pages: FeedPage[]; pageParams: unknown[] }>(
        key,
        (old) => {
          if (!old?.pages[0]) {
            return {
              pageParams: [undefined],
              pages: [{ messages: [message], nextCursor: null }],
            };
          }
          if (old.pages.some((page) => page.messages.some((item) => item.id === message.id))) {
            return old;
          }
          const first = old.pages[0];
          return {
            ...old,
            pages: [
              { ...first, messages: [message, ...first.messages] },
              ...old.pages.slice(1),
            ],
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.add(message.id);
        return next;
      });
      window.setTimeout(() => {
        setFreshIds((prev) => {
          const next = new Set(prev);
          next.delete(message.id);
          return next;
        });
      }, 1800);
      if (!atTopRef.current) setUnseen((n) => n + 1);
      if (soundRef.current) playTick();
    };

    const onPayload = (payload: LiveEvent) => {
      if (payload.type === "message") ingest(payload.message);
      if (payload.type === "hello" || payload.type === "ping") setConnected(true);
    };

    const stopAll = () => {
      socket?.close();
      socket = null;
      source?.close();
      source = null;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (pingTimer) window.clearInterval(pingTimer);
      fallbackTimer = undefined;
      pingTimer = undefined;
    };

    const startSse = () => {
      if (closed || !navigator.onLine) return;
      try {
        source = new EventSource("/api/stream");
        source.onopen = () => {
          using = "sse";
          setTransport("sse");
          setConnected(true);
        };
        source.onerror = () => {
          setConnected(false);
          if (!closed && navigator.onLine) {
            retryTimer = window.setTimeout(connect, 5_000);
          }
        };
        source.onmessage = (event) => {
          try {
            onPayload(JSON.parse(event.data) as LiveEvent);
          } catch {
            /* ignore */
          }
        };
      } catch {
        setConnected(false);
      }
    };

    const startWs = () => {
      if (closed || !navigator.onLine) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      try {
        socket = new WebSocket(`${proto}//${window.location.host}/api/ws`);
      } catch {
        startSse();
        return;
      }
      fallbackTimer = window.setTimeout(() => {
        if (closed) return;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          socket?.close();
          socket = null;
          startSse();
        }
      }, 2200);
      socket.onopen = () => {
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        using = "ws";
        setTransport("ws");
        setConnected(true);
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, 20_000);
      };
      socket.onmessage = (event) => {
        try {
          onPayload(JSON.parse(String(event.data)) as LiveEvent);
        } catch {
          /* ignore */
        }
      };
      socket.onerror = () => {
        setConnected(false);
      };
      socket.onclose = () => {
        setConnected(false);
        if (closed || !navigator.onLine) return;
        if (using === "ws") {
          retryTimer = window.setTimeout(connect, 4_000);
        }
      };
    };

    const connect = () => {
      if (closed) return;
      stopAll();
      using = null;
      if (!navigator.onLine) {
        setConnected(false);
        setTransport(null);
        return;
      }
      startWs();
    };

    connect();

    const onOnline = () => {
      if (!closed) connect();
    };
    const onOffline = () => {
      stopAll();
      setConnected(false);
      setTransport(null);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      closed = true;
      stopAll();
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [queryClient, online]);

  function markAtTop(value: boolean) {
    atTopRef.current = value;
    if (value) setUnseen(0);
  }

  return {
    ...feed,
    messages,
    connected: online && connected,
    online,
    transport: online ? transport : null,
    freshIds,
    unseen,
    markAtTop,
    clearUnseen: () => setUnseen(0),
  };
}
