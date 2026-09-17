import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/telegram")({
  server: { handlers: {
    POST: async ({ request }) => {
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (secret) {
        const header = request.headers.get("x-telegram-bot-api-secret-token");
        if (header !== secret) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
      const { ingestTelegramUpdate } = await import("@/lib/pulse/ingest.server");
      let body: unknown;
      try { body = await request.json(); } catch { return Response.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
      const message = await ingestTelegramUpdate(body as never);
      return Response.json({ ok: true, ingested: Boolean(message) });
    },
    GET: async () => Response.json({ ok: true, hint: "POST Telegram Bot API updates here. Only allowlisted Kyiv civic sources are stored." }),
  } },
});
