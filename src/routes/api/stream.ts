import { createFileRoute } from "@tanstack/react-router";
import type { LiveEvent } from "@/lib/pulse/types";

export const Route = createFileRoute("/api/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { startIngestLoop } = await import("@/lib/pulse/ingest.server");
        const { encodeSse, subscribe } = await import("@/lib/pulse/realtime.server");
        startIngestLoop();

        const encoder = new TextEncoder();
        let closed = false;
        const stream = new ReadableStream({
          start(controller) {
            const send = (event: LiveEvent) => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(encodeSse(event)));
              } catch {
                closed = true;
              }
            };
            send({ type: "hello", at: new Date().toISOString() });
            const unsub = subscribe(send);
            const ping = setInterval(() => {
              send({ type: "ping", at: new Date().toISOString() });
            }, 15_000);
            const shutdown = () => {
              if (closed) return;
              closed = true;
              clearInterval(ping);
              unsub();
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            };
            request.signal.addEventListener("abort", shutdown);
          },
          cancel() {
            closed = true;
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
