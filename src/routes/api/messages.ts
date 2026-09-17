import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { startIngestLoop } = await import("@/lib/pulse/ingest.server");
        const { listMessages } = await import("@/lib/pulse/store.server");
        startIngestLoop();
        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor") ?? undefined;
        const query = url.searchParams.get("q") ?? undefined;
        const category = url.searchParams.get("category") ?? undefined;
        const source = url.searchParams.get("source");
        const limitRaw = url.searchParams.get("limit");
        const limit = limitRaw ? Number(limitRaw) : undefined;
        const sourceIds = source ? source.split(",").filter(Boolean) : undefined;
        const page = await listMessages({
          cursor,
          query,
          category,
          sourceIds,
          limit: Number.isFinite(limit) ? limit : undefined,
        });
        return Response.json(page);
      },
    },
  },
});
