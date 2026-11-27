// Önskelistan: sidan sparas så att den öppnas utan nät. Bara den här appens egna cacher städas,
// eftersom de andra apparna ligger på samma webbplats och har egna.
const PREFIX = "onskelista-";
const CACHE = PREFIX + "v202611271525";
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
// Chatten mellan mamma, pappa och andra är låst med deras lösenord. Mellanhanden kan inte läsa den, så den skickar det låsta
// meddelandet. Här låses det upp med nyckeln som appen har sparat i cachen ol-las (bara på mobiler där lösenordet är skrivet).
const b64u = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function lasUpp(body){
  const m = /^~([A-Za-z0-9_-]+)( \(\d+ meddelanden\))?$/.exec(body || "");
  if (!m) return body || "";
  try {
    const r = await (await caches.open("ol-las")).match("las-nyckel");
    if (!r) throw 0;
    const raw = b64u(await r.text()), u = b64u(m[1]);
    const k = await crypto.subtle.importKey("raw", raw.slice(0, 32), {name: "AES-GCM"}, false, ["decrypt"]);
    const p = new Uint8Array(await crypto.subtle.decrypt({name: "AES-GCM", iv: u.slice(0, 12)}, k, u.slice(12)));
    if (p[0] !== 1) throw 0;
    return new TextDecoder().decode(p.slice(2 + p[1])) + (m[2] || "");
  } catch(x){ return "Ett nytt meddelande. Öppna listan för att läsa det."; }
}
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(lasUpp(d.body).then(body => self.registration.showNotification(d.title || "Filips önskelista", {body, tag: d.tag || undefined, renotify: !!d.tag, data: {url: d.url || "./"}, icon: "icon-192.png", badge: "icon-192.png"})));
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
