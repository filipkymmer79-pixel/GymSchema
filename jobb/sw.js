// Jobbmotorn: offline-skal för appen. Datan (data.enc) hämtas från nätet först och visas från cachen utan nät. Bara den här appens egna cacher städas, eftersom de andra apparna ligger på samma webbplats och har egna.
const PREFIX = "jobbmotorn-";
const CACHE = PREFIX + "v202611280540";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    // app shell: network first, fall back to cache (so updates arrive, but offline works)
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.open(CACHE).then(c => c.match(req).then(r => r || c.match("./index.html")))));
    return;
  }
  if (url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")){
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => { const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; })));
  }
});

// Påminnelserna om rapporterna: workern skickar web push hit. Samma tagg per rapport, så det plingar varje gång men bara den senaste ligger kvar.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(self.registration.showNotification(d.title || "Jobbmotorn", {body: d.body || "", tag: d.tag || undefined, renotify: !!d.tag, data: {url: d.url || "./"}, icon: "icon-192.png", badge: "icon-192.png"}));
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
