/* Пульс Києва — cache the shell and already-fetched data. Live Telegram is network-only. */
const SHELL = "pulse-shell-v2";
const DATA = "pulse-data-v2";

const PRECACHE = [
  "/",
  "/feed",
  "/sources",
  "/search",
  "/settings",
  "/favicon.svg",
  "/icon-180.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL && key !== DATA)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isLiveChannel(url) {
  return url.pathname === "/api/stream" || url.pathname === "/api/ws";
}

function isViteDev(url) {
  return (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/node_modules") ||
    url.pathname.includes("vite") ||
    url.search.includes("t=") ||
    url.pathname.startsWith("/src/")
  );
}

function isApiData(url) {
  return (
    url.pathname === "/api/messages" ||
    url.pathname === "/api/sources" ||
    url.pathname === "/api/stats" ||
    url.pathname.startsWith("/_serverFn")
  );
}

async function networkFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      void cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const home = await cache.match("/");
      if (home) return home;
    }
    throw err;
  }
}

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    void cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isLiveChannel(url) || isViteDev(url)) return;

  if (isApiData(url) || url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(DATA, request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(SHELL, request));
    return;
  }

  event.respondWith(cacheFirst(SHELL, request));
});
