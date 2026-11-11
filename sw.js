const CACHE = "gymschema-v202611112202";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("gymschema-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (/\/(dag|shake)\//.test(url.pathname)) return; // Dagsschema och Shake har egna offline-skript
    // app shell: network first (no-cache = fråga servern varje gång, så uppdateringar syns direkt), fall back to cache offline
    e.respondWith(fetch(req, {cache: "no-cache"}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  if (url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")){
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => { const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; })));
  }
});
