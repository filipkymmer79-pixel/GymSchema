// Mål: offline shell. Only this app's own caches are ever cleaned up,
// because GymSchema and the other apps share the same site and keep caches of their own.
const PREFIX = "mal-";
const CACHE = PREFIX + "v202611271549";
const SHELL = ["./", "./index.html", "./icon-180.png", "./icon-192.png", "./fonts/albert-sans-latin.woff2", "./fonts/albert-sans-latin-ext.woff2", "./fonts/eb-garamond-italic-latin.woff2", "./fonts/eb-garamond-italic-latin-ext.woff2", "./fonts/eb-garamond-latin.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes("/fonts/")) {
    // the fonts never change: cache first
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))));
    return;
  }
  // the page: network first, so a new list arrives at once, and the cache when offline
  e.respondWith(fetch(req, {cache: "no-cache"}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.open(CACHE).then(c => c.match(req, {ignoreSearch: true}).then(r => r || c.match("./index.html")))));
});
