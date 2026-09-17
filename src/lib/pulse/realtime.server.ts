import type { LiveEvent, MessageView } from "./types";

type Listener = (event: LiveEvent) => void;

const g = globalThis as typeof globalThis & {
  __pulseBus__?: Set<Listener>;
  __pulseLastLiveAt__?: string | null;
};

function listeners(): Set<Listener> {
  g.__pulseBus__ ??= new Set();
  return g.__pulseBus__;
}

export function lastLiveAt(): string | null {
  return g.__pulseLastLiveAt__ ?? null;
}

export function publishMessage(message: MessageView): void {
  g.__pulseLastLiveAt__ = new Date().toISOString();
  const event: LiveEvent = { type: "message", message };
  for (const listener of listeners()) {
    try {
      listener(event);
    } catch {
      /* ignore a broken subscriber */
    }
  }
}

export function subscribe(listener: Listener): () => void {
  listeners().add(listener);
  return () => {
    listeners().delete(listener);
  };
}

export function encodeSse(event: LiveEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
