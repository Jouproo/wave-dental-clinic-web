// Minimal service worker, scoped to /admin only (see registration in
// AdminShell.tsx). Its only job is to satisfy the browser's PWA
// "installable" criteria (a registered service worker with a fetch
// handler) so the native "Install app" option appears — it deliberately
// does NOT cache anything. This is a live dashboard (bookings, CRM leads);
// caching responses here would risk showing stale data, which is exactly
// the class of bug already fixed once in this app. Pure network pass-through.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
