const CACHE = "gymschema-v202611181008";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./vendor/jszip.min.js", "./vendor/archivo-var-ext.woff2", "./vendor/manrope-latin-ext.woff2", "./vendor/bigshoulders-800.woff2", "./vendor/bigshoulders-900.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("gymschema-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Påminnelser: workern på Cloudflare skickar web push hit, och ett tryck öppnar rätt flik i appen
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data ? e.data.text() : ""}; }
  const show = () => self.registration.showNotification(d.title || "GymSchema", {body: d.body || "", tag: d.tag || undefined, data: {url: d.url || "./", kind: d.kind || ""}, icon: "icon-192.png"});
  // Vilan är slut: bara den senaste ligger kvar bland notiserna
  const old = d.kind === "vila" && self.registration.getNotifications ? self.registration.getNotifications().then(l => { l.forEach(n => { if (n.data && n.data.kind === "vila") n.close(); }); }).catch(() => {}) : Promise.resolve();
  e.waitUntil(old.then(show, show));
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
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (/\/(dag|shake|pappa|plan|jobb|idag|nollan)\//.test(url.pathname)) return; // Dagsschema, Shake, pappas GymStart, Plan, Jobbmotorn, Idag och Nollan har egna offline-skript
    // tillbaka från Spotify-inloggningen: adressen har en engångskod – den hämtas som vanligt men sparas inte
    if (url.searchParams.has("code") || url.searchParams.has("error")){ e.respondWith(fetch(req, {cache: "no-cache"}).catch(() => caches.match("./index.html"))); return; }
    // app shell: network first (no-cache = fråga servern varje gång, så uppdateringar syns direkt), fall back to cache offline
    e.respondWith(fetch(req, {cache: "no-cache"}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  if (url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")){
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => { const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; })));
  }
});
