/**
 * Native WebSocket live channel at /api/ws on the Vite HTTP server.
 * SSE at /api/stream remains the fallback when Upgrade is not available.
 */
import { WebSocketServer } from "ws";

const PATH = "/api/ws";

function pathOnly(url = "") {
  return String(url).split("?")[0] ?? "";
}

function attach(httpServer, loadRealtime) {
  if (!httpServer) return;
  const g = globalThis;
  if (g.__pulseWssAttached__) return;
  g.__pulseWssAttached__ = true;

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    if (pathOnly(req.url) !== PATH) return;
    const protocol = req.headers["sec-websocket-protocol"];
    if (protocol === "vite-hmr" || protocol === "vite-ping") return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", async (socket) => {
    let unsub = () => undefined;
    let ping;
    try {
      const mod = await loadRealtime();
      mod.startIngestLoop?.();
      socket.send(JSON.stringify({ type: "hello", at: new Date().toISOString() }));
      unsub = mod.subscribe((event) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify(event));
        }
      });
      ping = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: "ping", at: new Date().toISOString() }));
        }
      }, 15_000);
    } catch (err) {
      console.error("[pulse] websocket setup failed", err);
      socket.close(1011, "unavailable");
      return;
    }

    socket.on("message", (raw) => {
      const text = typeof raw === "string" ? raw : Buffer.from(raw).toString();
      if (text === "ping") {
        socket.send(JSON.stringify({ type: "ping", at: new Date().toISOString() }));
      }
    });

    const shutdown = () => {
      if (ping) clearInterval(ping);
      unsub();
    };
    socket.on("close", shutdown);
    socket.on("error", shutdown);
  });
}

export function pulseWsPlugin() {
  return {
    name: "pulse-websocket",
    configureServer(server) {
      return () => {
        attach(server.httpServer, () =>
          Promise.all([
            server.ssrLoadModule("/src/lib/pulse/ingest.server.ts"),
            server.ssrLoadModule("/src/lib/pulse/realtime.server.ts"),
          ]).then(([ingest, realtime]) => ({
            startIngestLoop: ingest.startIngestLoop,
            subscribe: realtime.subscribe,
          })),
        );
      };
    },
    configurePreviewServer() {
      // Production preview / Vercel cannot hold a native WebSocket. The
      // client falls back to SSE at /api/stream.
    },
  };
}
