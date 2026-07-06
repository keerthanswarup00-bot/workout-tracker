const CACHE = "striv-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/coach.css",
  "/js/script.js",
  "/js/coach-system.js",
  "/js/problem-database.js",
  "/js/lesson-database.js",
  "/js/goal-center.js",
  "/js/cas-engine.js",
  "/js/adaptive-engine.js",
  "/js/coach-engine.js",
  "/js/program-review-engine.js",
  "/core/engine-calculators.js",
  "/core/engine-coach.js",
  "/core/engine-nutrition.js",
  "/core/engine-program-generator.js",
  "/core/engine-rules.js",
  "/core/engine-types.js",
  "/core/engine-validator.js",
  "/assets/icons/favicon.svg",
  "/assets/icons/logo.svg",
  "/assets/icons/logo-accent.svg",
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
