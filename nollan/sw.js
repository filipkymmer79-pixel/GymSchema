// Nollan: offline shell. Only this app's own caches are ever cleaned up,
// because the other apps share the same site and keep caches of their own.
const PREFIX = "nollan-";
const CACHE = PREFIX + "v202611171346";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    // app shell: network first (so an update arrives at once), fall back to cache offline
    e.respondWith(fetch(req, {cache: "no-cache"}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.open(CACHE).then(c => c.match(req).then(r => r || c.match("./index.html")))));
    return;
  }
  if (url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")){
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => { const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; })));
  }
});
