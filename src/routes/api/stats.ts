import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        const { startIngestLoop } = await import("@/lib/pulse/ingest.server");
        const { getStats } = await import("@/lib/pulse/store.server");
        startIngestLoop();
        return Response.json(await getStats());
      },
    },
  },
});
