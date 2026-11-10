// Shake: offline shell. Only this app's own caches are ever cleaned up,
// because the gym app and the day schedule share the same site and keep caches of their own.
const PREFIX = "shake-";
const CACHE = PREFIX + "v202611102221";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./fonts/sofia-sans.woff2", "./fonts/sofia-sans-extra-condensed.woff2", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // network first, fall back to what is saved (so updates arrive, but it works without a connection)
  e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.open(CACHE).then(c => c.match(req).then(r => r || c.match("./index.html")))));
});
