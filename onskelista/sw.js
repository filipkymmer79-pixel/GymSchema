// Önskelistan: sidan sparas så att den öppnas utan nät. Bara den här appens egna cacher städas,
// eftersom de andra apparna ligger på samma webbplats och har egna.
const PREFIX = "onskelista-";
const CACHE = PREFIX + "v202611271328";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./fonts/fraunces.woff2", "./fonts/schibsted-grotesk.woff2", "./fonts/caveat.woff2", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // nätet först, annars det som är sparat (så kommer ändringar fram, men sidan öppnas även utan nät)
  e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.open(CACHE).then(c => c.match(req).then(r => r || c.match("./index.html")))));
});
// Notiser: mellanhanden på Cloudflare skickar web push hit när någon skriver i chatten, köper något eller när Filip lägger till en sak.
// Ett tryck på notisen öppnar appen på rätt ställe (chatten eller saken).
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(self.registration.showNotification(d.title || "Filips önskelista", {body: d.body || "", tag: d.tag || undefined, renotify: !!d.tag, data: {url: d.url || "./"}, icon: "icon-192.png", badge: "icon-192.png"}));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope);
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    const c = list.find(x => x.url.indexOf(self.registration.scope) === 0);
    if (c){ c.postMessage({nav: url.hash.slice(1)}); return c.focus(); }
    return self.clients.openWindow(url.href);
  }));
});
