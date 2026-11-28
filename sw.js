const CACHE = "gymschema-v202611280200";
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
/* Versioner (25 nov 2026): märket och den gamla versionen ligger i cachen gs-pin, som aktiveringen ovan inte städar bort */
const PIN = "gs-pin", PIN_SCOPE = new URL(self.registration.scope).pathname;
const pinKey = p => new URL(p, self.registration.scope).href;
function pinShell(req){
  const url = new URL(req.url);
  if (url.searchParams.has("code") || url.searchParams.has("error")) return fetch(req, {cache: "no-cache"}).catch(() => caches.match("./index.html"));
  return fetch(req, {cache: "no-cache"}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")));
}
async function pinGet(){ const c = await caches.open(PIN), r = await c.match(pinKey("pin")); return r ? r.json() : null; }
async function pinResp(req, p, app){
  if (!app) return new Response(JSON.stringify({build: p.build || p.date || "", ts: +p.ts || 0}), {headers: {"Content-Type": "application/json", "Cache-Control": "no-store"}});
  const c = await caches.open(PIN), key = pinKey("v/" + p.id + ".html");
  let r = await c.match(key);
  if (!r){ try { const n = await fetch(key, {cache: "no-cache"}); if (n.ok){ await c.put(key, n.clone()); r = n; } } catch(e){} }
  if (!r) return pinShell(req);
  return new Response(pinHtml(await r.text(), p), {headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store"}});
}
// Raden överst i den gamla versionen: vilken version det är och knappen Tillbaka till senaste (tar bort märket och laddar om)
function pinHtml(html, p){
  const esc = x => String(x || "").replace(/[&<>"]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[ch]);
  const bar = '<div id="gsPin" role="region" aria-label="Gammal version" style="position:relative;z-index:2147483000;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#111214;color:#fff;padding:calc(env(safe-area-inset-top, 0px) + 10px) 14px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:14px;line-height:1.35">' +
    '<span style="min-width:0"><b style="display:block;font-size:15px">Gammal version</b><span style="display:block;opacity:.75;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.date) + ' · ' + esc(p.title) + '</span></span>' +
    '<button type="button" id="gsPinBack" style="flex:none;border:0;border-radius:14px;padding:12px 14px;background:#fff;color:#111214;font-size:14px;font-weight:800;line-height:1.1">Tillbaka till senaste</button></div>' +
    '<script>document.getElementById("gsPinBack").addEventListener("click",function(){var b=this;window.__gsPinBack=1;b.disabled=true;b.textContent="Byter…";var go=function(){location.reload();};caches.open("gs-pin").then(function(c){return c.delete(new URL("pin",location.href).href);}).then(go,go);});</script>';
  // Först i <head>: en gammal version som själv har Versioner (från 25 nov) får inte se märket – då skulle den tro att den senaste
  // visas fast den gamla inte gick att öppna, och ta bort det. Bara knappen Tillbaka till senaste tar bort märket.
  const guard = '<script>window.__gsPinned=1;try{var gsIsPin=function(r){try{return new URL(typeof r==="string"?r:r.url,location.href).pathname.slice(-4)==="/pin";}catch(e){return false;}};' +
    'var gsD=Cache.prototype.delete,gsM=Cache.prototype.match;Cache.prototype.delete=function(r){return gsIsPin(r)&&!window.__gsPinBack?Promise.resolve(false):gsD.apply(this,arguments);};' +
    'Cache.prototype.match=function(r){return gsIsPin(r)?Promise.resolve(undefined):gsM.apply(this,arguments);};}catch(e){}</script>';
  const hd = /<head[^>]*>/i.exec(html);
  html = hd ? html.slice(0, hd.index + hd[0].length) + guard + html.slice(hd.index + hd[0].length) : guard + html;
  const m = /<body[^>]*>/i.exec(html);
  return m ? html.slice(0, m.index + m[0].length) + bar + html.slice(m.index + m[0].length) : bar + html;
}
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (/\/(dag|shake|pappa|plan|jobb|idag|nollan)\//.test(url.pathname)) return; // Dagsschema, Shake, pappas GymStart, Plan, Jobbmotorn, Idag och Nollan har egna offline-skript
    if (/\/v\/[^\/]+\.(html|json)$/.test(url.pathname)) return; // Versioner: sidan hämtar de gamla byggena själv och sparar dem i gs-pin
    // Versioner (25 nov 2026): har Filip valt en gammal version visas den i stället för den senaste – med en rad överst för att komma
    // tillbaka – och version.json svarar med den gamla versionens nummer, så att dess uppdateringskoll inte laddar om sidan
    const app = url.pathname === PIN_SCOPE || url.pathname === PIN_SCOPE + "index.html";
    if ((app && req.mode === "navigate") || url.pathname === PIN_SCOPE + "version.json"){
      e.respondWith(pinGet().then(p => p ? pinResp(req, p, app) : pinShell(req)).catch(() => pinShell(req)));
      return;
    }
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
