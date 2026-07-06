const CACHE = "striv-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/script.js",
  "/js/data/prs.js",
  "/js/problem-database.js",
  "/js/lesson-database.js",
  "/js/goal-center.js",
  "/js/cas-engine.js",
  "/js/adaptive-engine.js",
  "/js/coach-engine.js",
  "/js/program-review-engine.js",
  "/assets/icons/favicon.svg",
  "/manifest.json",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return cached || new Response("Offline", { status: 503 });
      }
    })(),
  );
});
