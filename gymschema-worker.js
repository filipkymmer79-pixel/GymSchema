// GymSchema-mellanhanden (Cloudflare Worker)
// 1) Gardinen: skickar vidare appens anrop till api.switch-bot.com (SwitchBots moln släpper inte in webbappar).
//    Token och secret kommer från appen och sparas inte här.
// 2) Påminnelser: sparar appens notisschema i KV (bindningen GS) och skickar notiserna med web push.
//    Cron-schemat (varje minut) kollar vad som ska skickas.
// 3) Vilan är slut (version 2): när mobilen låses under vilan lämnar appen en notis med klockslag på sekunden.
//    Cron-körningen stannar kvar den minut den äger, hittar notisen och skickar den precis när vilan är slut.
//    Varje nyckel som används för det läses bara en gång – då kan KV aldrig svara med ett gammalt värde.
// 4) Önskelistan: vem som köper vad, sakerna Filip lägger till, chatten och notiserna (KV-nycklarna ol:mamma, ol:pappa, ol:annan, ol:filip och ol:push).
const V = 2;
const SLOT = 10e3, REST_MAX = 12 * 60e3;
const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
const APP = "https://filipkymmer79-pixel.github.io";
const CONTACT = "https://filipkymmer79-pixel.github.io/GymSchema/";
const te = new TextEncoder();
const b64u = b => { let s = ""; const u = new Uint8Array(b); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = s => { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a){ o.set(x, p); p += x.length; } return o; };
const sha = async s => b64u(await crypto.subtle.digest("SHA-256", te.encode(s)));
async function hkdf(salt, ikm, info, len){
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({name: "HKDF", hash: "SHA-256", salt, info}, k, len * 8));
}
async function vapid(env){
  let v = await env.GS.get("vapid", "json");
  if (!v){
    const kp = await crypto.subtle.generateKey({name: "ECDSA", namedCurve: "P-256"}, true, ["sign", "verify"]);
    v = {jwk: await crypto.subtle.exportKey("jwk", kp.privateKey), pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey))};
    await env.GS.put("vapid", JSON.stringify(v));
  }
  return v;
}
// Web push (RFC 8291 aes128gcm + RFC 8292 VAPID)
async function push(env, sub, msg, ttl){
  const v = await vapid(env);
  const jh = b64u(te.encode('{"typ":"JWT","alg":"ES256"}'));
  const jb = b64u(te.encode(JSON.stringify({aud: new URL(sub.endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: CONTACT})));
  const sk = await crypto.subtle.importKey("jwk", v.jwk, {name: "ECDSA", namedCurve: "P-256"}, false, ["sign"]);
  const sig = await crypto.subtle.sign({name: "ECDSA", hash: "SHA-256"}, sk, te.encode(jh + "." + jb));
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({name: "ECDH", namedCurve: "P-256"}, true, ["deriveBits"]);
  const as = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uk = await crypto.subtle.importKey("raw", ua, {name: "ECDH", namedCurve: "P-256"}, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({name: "ECDH", public: uk}, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(te.encode("WebPush: info\0"), ua, as), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await crypto.subtle.importKey("raw", await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16), "AES-GCM", false, ["encrypt"]);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv: nonce}, cek, cat(te.encode(JSON.stringify(msg)), new Uint8Array([2]))));
  const r = await fetch(sub.endpoint, {method: "POST", body: cat(salt, new Uint8Array([0, 0, 16, 0, 65]), as, ct), headers: {
    "Authorization": "vapid t=" + jh + "." + jb + "." + b64u(sig) + ", k=" + v.pub,
    "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", "TTL": String(ttl || 3600), "Urgency": "high"}});
  return r.status;
}
// Schemat: det som är dags nu. Svarar false om prenumerationen är borta hos Apple.
async function sendDue(env, cfg, now){
  const due = cfg.events.filter(e => e.at <= now + 20e3 && now - e.at < 15 * 60e3);
  if (!due.length) return true;
  const sent = (await env.GS.get("sent", "json")) || {}, todo = due.filter(e => !sent[e.id]);
  if (!todo.length) return true;
  for (const e of todo){
    const st = await push(env, cfg.sub, {title: e.title, body: e.body, url: e.url, tag: e.id});
    if (st === 404 || st === 410){ await env.GS.delete("cfg"); return false; }
    sent[e.id] = now;
  }
  for (const k in sent) if (now - sent[k] > 3 * 864e5) delete sent[k];
  await env.GS.put("sent", JSON.stringify(sent));
  return true;
}
// Vilan är slut: väntar till en och en halv sekund före, frågar om notisen är avbokad och skickar den så att den landar i tid.
async function restJob(env, cfg, e){
  if (Date.now() - e.at > 20e3 || e.at - Date.now() > REST_MAX) return;   // för gammal för att vara till nytta, eller orimligt långt bort
  await sleep(e.at - 1500 - Date.now());
  let off = null; try { off = await env.GS.get("rx:" + e.id); } catch(x){}
  if (off) return;
  await sleep(e.at - 600 - Date.now());
  const st = await push(env, cfg.sub, {title: e.title, body: e.body, url: e.url, tag: e.id, kind: "vila"}, 120);
  if (st === 404 || st === 410) await env.GS.delete("cfg");
}
// Körningen äger sin minut (sex luckor om tio sekunder). Tre sekunder efter att en lucka stängts läses dess nyckel – en enda gång.
async function rests(env, cfg, S){
  if (!(cfg.rest > Date.now())) return;
  const n0 = Math.floor(S / SLOT), jobs = [];
  for (let k = 0; k < 6; k++){
    await sleep((n0 + k + 1) * SLOT + 3000 - Date.now());
    let e = null; try { e = await env.GS.get("rs:" + (n0 + k), "json"); } catch(x){}
    if (e && e.id && typeof e.at === "number") jobs.push(restJob(env, cfg, e).catch(() => {}));
  }
  await Promise.all(jobs);
}
async function tick(env, S){
  if (!env.GS) return;
  const now = Date.now(), last = Number(await env.GS.get("cron")) || 0;
  if (now - last > 50 * 60e3) await env.GS.put("cron", String(now));
  const cfg = await env.GS.get("cfg", "json");
  if (!cfg || !cfg.sub || !Array.isArray(cfg.events)) return;
  if (!(await sendDue(env, cfg, now))) return;
  await rests(env, cfg, S || now);
}
async function pushApi(request, env, path, json){
  if (!env.GS) return json({error: "kv"}, 503);
  if (path === "/push/key" && request.method === "GET"){
    const v = await vapid(env);
    return json({key: v.pub, cron: Number(await env.GS.get("cron")) || 0, on: !!(await env.GS.get("cfg")), v: V});
  }
  if (request.method !== "POST") return json({error: "method"}, 405);
  let b = {}; try { b = JSON.parse(await request.text()) || {}; } catch(e){}
  // nyckeln kommer i rubriken – eller i kroppen från /push/rest, som skickas medan appen göms (sendBeacon kan inte sätta rubriker)
  const key = request.headers.get("X-GS-Key") || (path === "/push/rest" && typeof b.key === "string" ? b.key : "");
  if (key.length < 20) return json({error: "key"}, 400);
  const kh = await sha(key), cfg = await env.GS.get("cfg", "json");
  const sub = b && b.sub && typeof b.sub.endpoint === "string" && /^https:\/\//.test(b.sub.endpoint) && b.sub.keys && b.sub.keys.p256dh && b.sub.keys.auth ? b.sub : null;
  if (cfg && cfg.kh !== kh && !(sub && cfg.sub && sub.endpoint === cfg.sub.endpoint)) return json({error: "taken"}, 409);
  if (path === "/push/save"){
    if (!sub) return json({error: "sub"}, 400);
    const events = (Array.isArray(b.events) ? b.events : []).filter(e => e && typeof e.at === "number" && e.title).slice(0, 300)
      .map(e => ({id: String(e.id || e.at).slice(0, 60), at: e.at, title: String(e.title).slice(0, 90), body: String(e.body || "").slice(0, 300), url: String(e.url || "./").slice(0, 80)}));
    // rest: till när appen kan lämna notiser om att vilan är slut – bara då stannar cron-körningen kvar och letar
    const rest = Math.max(0, Math.min(Number(b.rest) || 0, Date.now() + 6 * 3600e3));
    await env.GS.put("cfg", JSON.stringify({kh, sub: {endpoint: sub.endpoint, keys: {p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth)}}, events, rest}));
    return json({ok: true, n: events.length, cron: Number(await env.GS.get("cron")) || 0, v: V, rest});
  }
  if (path === "/push/test"){
    if (!cfg) return json({error: "off"}, 404);
    const st = await push(env, cfg.sub, {title: "Påminnelserna funkar ✓", body: "Så här ser det ut när GymSchema påminner dig.", url: "./#vanor", tag: "test"});
    if (st === 404 || st === 410) await env.GS.delete("cfg");
    return json({ok: st >= 200 && st < 300, status: st});
  }
  if (path === "/push/off"){ if (cfg) await env.GS.delete("cfg"); return json({ok: true}); }
  if (path === "/push/rest"){
    if (!cfg) return json({error: "off"}, 404);
    const clean = x => String(x || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
    const prev = clean(b.prev), id = clean(b.id), at = Number(b.at) || 0;
    if (prev.length >= 6) await env.GS.put("rx:" + prev, "1", {expirationTtl: 900});     // avboka den förra
    if (!at) return json({ok: true, v: V});
    const now = Date.now();
    if (id.length < 6 || at < now + 5e3 || at > now + REST_MAX) return json({error: "at"}, 400);
    // luckan: en och en halv sekund fram, så att skrivningen hinner bli klar innan cron-körningen läser nyckeln
    await env.GS.put("rs:" + Math.floor((now + 1500) / SLOT), JSON.stringify({id, at, title: String(b.title || "Vilan är slut").slice(0, 90), body: String(b.body || "").slice(0, 300), url: String(b.url || "./#pass").slice(0, 80)}), {expirationTtl: 120});
    return json({ok: true, v: V, rest: cfg.rest || 0});
  }
  return json({error: "path"}, 404);
}
// 4) Önskelistan (GymSchema/onskelista/): vem som köper vad, sakerna Filip lägger till själv, chatten och notiserna.
//    Alla som har länken får läsa, markera köp och skriva i chatten. Att ändra själva listan kräver Filips nyckel –
//    här står bara nyckelns SHA-256. Kommer nyckeln med i ett anrop svarar workern utan köpen och utan den del av
//    chatten som inte är skriven till Filip. Hans egen mobil får alltså aldrig veta vad som är köpt.
//    Var och en skriver bara i sin egen KV-nyckel (ol:mamma, ol:pappa, ol:annan och ol:filip). KV kan svara med ett
//    halvminutsgammalt värde, och med en gemensam nyckel hade mamma och pappa kunnat skriva över varandra.
//    Varje nyckel har en tidsstämpel (r) som byts vid varje skrivning. Appen skickar med de stämplar den redan har
//    och får bara tillbaka det som har ändrats.
//    Varje mobil har en hemlig kod (d). Utåt syns bara kodens avtryck (p).
const OL_AGARE = "emaASCYKnJPGyni8n0VtBXXTizQfEV7IKdoSN8JAz7Q";
const OL_SLOTS = ["mamma", "pappa", "annan", "filip"];
const OL_TAK = {mamma: 200, pappa: 200, annan: 150, filip: 120, push: 20};   // skrivningar per dygn och nyckel (KV-kvoten är 1 000 om dagen)
const OL_MAX_KOP = 60, OL_MAX_EGNA = 40, OL_MAX_CHATT = 60, OL_MAX_PUSH = 12, OL_DYGN = 864e5;
const OL_BILDER = ["paket", "matta", "shorts", "airpods", "tofflor", "satoro", "panna", "stekspade", "hantel", "italki", "vinyl", "tungskrapa", "icebug", "hoodie", "dorr", "hopprep", "shaker", "tang", "glas", "borste", "bio", "ljuslist", "halsduk"];
const OL_PUSHVARD = /^https:\/\/[a-z0-9.-]+\.(push\.apple\.com|googleapis\.com|notify\.windows\.com|mozilla\.com|mozaws\.net)\//;
const olText = (x, n) => String(x == null ? "" : x).replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, n);
const olId = x => typeof x === "string" && /^[a-z0-9-]{1,32}$/.test(x) ? x : "";
const olNamn = (v, n) => v === "mamma" ? "Mamma" : v === "pappa" ? "Pappa" : v === "filip" ? "Filip" : (n || "Någon");
async function olLas(env, k){
  let v = null;
  try { v = await env.GS.get("ol:" + k, {type: "json", cacheTtl: 30}); }      // 30 s är det kortaste KV går med på
  catch(e){ v = await env.GS.get("ol:" + k, "json"); }
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
// Sparar en nyckel. Svarar "tak" när dygnets skrivningar är slut och "snabbt" när KV säger nej (högst en skrivning i sekunden per nyckel).
async function olSpara(env, k, v){
  const dag = new Date().toISOString().slice(0, 10), antal = v.n && v.n.dag === dag ? (v.n.antal || 0) + 1 : 1;
  if (antal > OL_TAK[k]) return "tak";
  const fore = v.r || 0;
  v.n = {dag, antal}; v.r = Math.max(Date.now(), fore + 1);
  try { await env.GS.put("ol:" + k, JSON.stringify(v)); } catch(e){ v.r = fore; return "snabbt"; }
  return "";
}
// Det som skickas ut av en nyckel. Med Filips nyckel: inga köp, och bara den chatt som är skriven till honom.
function olVy(k, s, agare){
  const m = (Array.isArray(s.m) ? s.m : []).filter(x => !agare || x.f || k === "filip");
  if (k === "filip") return {r: s.r || 0, lista: {egna: Array.isArray(s.egna) ? s.egna : [], lappar: s.lappar || {}, dolda: s.dolda || {}}, m};
  return agare ? {r: s.r || 0, m} : {r: s.r || 0, kopt: s.kopt || {}, borta: s.borta || {}, m};
}
// Notiser till dem som har slagit på dem. till väljer mottagare. Prenumerationer som push-tjänsten har glömt städas bort.
async function olNotis(env, till, msg){
  const P = await olLas(env, "push"), subs = Array.isArray(P.subs) ? P.subs : [], mot = subs.filter(till);
  if (!mot.length) return;
  const st = await Promise.all(mot.map(x => push(env, {endpoint: x.e, keys: {p256dh: x.k, auth: x.a}}, msg, 12 * 3600).catch(() => 0)));
  const dod = mot.filter((x, i) => st[i] === 404 || st[i] === 410);
  if (dod.length){ P.subs = subs.filter(x => dod.indexOf(x) < 0); await olSpara(env, "push", P); }
}
async function wishApi(request, env, ctx, url, json){
  if (!env.GS) return json({error: "kv"}, 503);
  const path = url.pathname, GET = request.method === "GET";
  const key = request.headers.get("X-OL-Key") || "";
  const agare = !!key && key.length >= 20 && (await sha(key)) === OL_AGARE;
  if (key && !agare) return json({error: "agare"}, 403);                 // fel nyckel får aldrig ett svar med köpen i
  if (path === "/onskelista/pushnyckel" && GET) return json({ol: 1, key: (await vapid(env)).pub});
  let b = {};
  if (!GET){
    if (request.method !== "POST") return json({error: "method"}, 405);
    const raw = await request.text();
    if (raw.length > 6000) return json({error: "in"}, 413);
    try { b = JSON.parse(raw); } catch(e){}
    if (!b || typeof b !== "object") b = {};
  }
  const fel = (kod, status) => json({error: kod}, status || 400);
  const r0 = GET ? url.searchParams.get("r") : b.r;
  const kand = typeof r0 === "string" && /^\d{1,16}(\.\d{1,16}){3}$/.test(r0) ? r0.split(".").map(Number) : null;
  const L = await Promise.all(OL_SLOTS.map(k => olLas(env, k))), S = {};
  OL_SLOTS.forEach((k, i) => { S[k] = L[i]; });
  const svar = (extra, status) => {
    const rev = {}, slots = {};
    OL_SLOTS.forEach((k, i) => { rev[k] = S[k].r || 0; if (!kand || kand[i] !== rev[k]) slots[k] = olVy(k, S[k], agare); });
    return json(Object.assign({ol: 1, rev, slots, t: Date.now()}, agare ? {agare: true} : null, extra || null), status);
  };
  if (GET) return path === "/onskelista" ? svar() : fel("path", 404);
  const d = typeof b.d === "string" && /^[A-Za-z0-9_-]{16,40}$/.test(b.d) ? b.d : "";
  const p = d ? (await sha(d)).slice(0, 12) : "";
  const vem = agare ? "filip" : (["mamma", "pappa", "annan"].indexOf(b.vem) >= 0 ? b.vem : "");
  const namn = vem === "annan" ? olText(b.namn, 16) : "";
  const id = olId(b.id);
  // i mammas och pappas nyckel är allt deras eget; i ol:annan skiljs folk åt på mobilens avtryck eller namnet de har skrivit
  const min = x => x.p === p || vem === "mamma" || vem === "pappa" || vem === "filip" || (!!namn && x.n === namn);
  const skriv = async k => { const f = await olSpara(env, k, S[k]); return f ? fel(f, 429) : null; };
  const efter = jobb => { const j = jobb.catch(() => {}); if (ctx && ctx.waitUntil) ctx.waitUntil(j); return j; };

  if (path === "/onskelista/kop"){
    if (agare || !id || !p || !vem) return fel("in");
    const s = S[vem], kopt = s.kopt || (s.kopt = {}), borta = s.borta || (s.borta = {}), har = kopt[id];
    if (b.av){
      if (!har || !min(har)) return svar({ok: true, du: p});              // inte din markering: inget att ta bort
      delete kopt[id]; borta[id] = Date.now();                             // borta: så att personens andra mobil förstår att det var meningen
    } else {
      if (har && !min(har)) return svar({error: "tagen", du: p}, 409);    // någon annan hann före
      if (har) return svar({ok: true, du: p});                             // redan sparat: ingen skrivning
      if (OL_SLOTS.some(k => k !== vem && k !== "filip" && S[k].kopt && S[k].kopt[id])) return svar({error: "tagen", du: p}, 409);
      if (Object.keys(kopt).length >= OL_MAX_KOP) return fel("full");
      kopt[id] = namn ? {t: Date.now(), p, n: namn} : {t: Date.now(), p};
      delete borta[id];
    }
    for (const k in borta) if (Date.now() - borta[k] > 14 * OL_DYGN) delete borta[k];
    const f = await skriv(vem); if (f) return f;
    if (!b.av) efter(olNotis(env, x => !x.ag && x.p !== p, {title: olNamn(vem, namn) + " köper en sak", body: olText(b.sak, 80) || "Öppna listan och se vilken.", url: "./#sak-" + id, tag: "ol-k-" + id}));
    return svar({ok: true, du: p});
  }

  if (path === "/onskelista/chatt"){
    if (!p || !vem) return fel("in");
    const s = S[vem], m = Array.isArray(s.m) ? s.m : (s.m = []), bort = olId(b.bort), nya = [];
    if (bort){
      const i = m.findIndex(x => x.id === bort && min(x));
      if (i < 0) return svar({ok: true, du: p});
      m.splice(i, 1);
    } else {
      // flera: appen samlar ihop det som väntar och skickar allt i en skrivning (KV tar en skrivning i sekunden per nyckel)
      const flera = Array.isArray(b.flera) ? b.flera.slice(0, 8) : [{id: b.id, text: b.text, f: b.f, sak: b.sak}];
      let giltiga = 0;
      for (const q of flera){
        const qid = olId(q && q.id), x = olText(q && q.text, 500);
        if (!qid || !x) continue;
        giltiga++;
        if (nya.some(y => y.id === qid) || OL_SLOTS.some(k => (Array.isArray(S[k].m) ? S[k].m : []).some(y => y.id === qid))) continue;   // redan framme
        const e = {id: qid, t: Date.now() + nya.length, p, x};
        if (namn) e.n = namn;
        if (agare || q.f) e.f = 1;                                         // f: Filip får se den
        const om = olId(q.sak); if (om) e.s = om;
        m.push(e); nya.push(e);
      }
      if (!giltiga) return fel("in");
      if (!nya.length) return svar({ok: true, du: p});
      while (m.length > OL_MAX_CHATT) m.shift();
    }
    const f = await skriv(vem); if (f) return f;
    if (nya.length){
      const sist = nya[nya.length - 1], tillF = agare ? null : nya.filter(y => y.f).pop();
      const text = y => y.x.slice(0, 140) + (nya.length > 1 ? " (" + nya.length + " meddelanden)" : "");
      efter(olNotis(env, x => !x.ag && x.p !== p, {title: agare ? "Filip svarar" : olNamn(vem, namn) + (sist.f ? " frågar Filip" : " skriver"), body: text(sist), url: "./#chatt", tag: "ol-c"}));
      if (tillF) efter(olNotis(env, x => !!x.ag && x.p !== p, {title: olNamn(vem, namn) + " frågar dig", body: text(tillF), url: "./#chatt", tag: "ol-c"}));
    }
    return svar({ok: true, du: p});
  }

  if (path === "/onskelista/lista"){
    if (!agare) return fel("agare", 403);
    if (b.op === "hej") return svar({ok: true});
    const s = S.filip, egna = Array.isArray(s.egna) ? s.egna : (s.egna = []), lappar = s.lappar || (s.lappar = {}), dolda = s.dolda || (s.dolda = {});
    let ny = null, extra = null;
    if (b.op === "ny" || b.op === "andra"){
      const i = b.op === "andra" ? egna.findIndex(e => e.id === id) : -1, k = b.sak && typeof b.sak === "object" ? b.sak : {};
      const sakNamn = olText(k.namn, 80), lank = olText(k.url, 400), pris = Number(k.pris), lucka = Number(k.lucka);
      if (!sakNamn || !/^https:\/\/[^\s/]+\.[^\s/]+/.test(lank) || (b.op === "andra" && i < 0)) return fel("in");
      if (i < 0 && egna.length >= OL_MAX_EGNA) return fel("full");
      const e = {id: i < 0 ? "e" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36) : id, namn: sakNamn, url: lank,
        pris: k.pris != null && k.pris !== "" && Number.isFinite(pris) && pris > 0 && pris < 1e7 ? Math.round(pris) : null,
        butik: olText(k.butik, 40), lapp: olText(k.lapp, 160), bild: OL_BILDER.indexOf(k.bild) >= 0 ? k.bild : "paket",
        lucka: lucka >= 1 && lucka <= 4 ? Math.floor(lucka) : 0, t: i < 0 ? Date.now() : egna[i].t};
      if (i < 0){ egna.push(e); ny = e; } else egna[i] = e;
      extra = {id: e.id};
    } else if (!id) return fel("in");
    else if (b.op === "bort"){ s.egna = egna.filter(e => e.id !== id); delete lappar[id]; delete dolda[id]; }
    else if (b.op === "lapp"){
      if (typeof b.text === "string") lappar[id] = olText(b.text, 160); else delete lappar[id];     // tom text: ingen lapp alls
      if (Object.keys(lappar).length > 120) return fel("full");
    } else if (b.op === "dolj"){
      if (b.dold) dolda[id] = 1; else delete dolda[id];
      if (Object.keys(dolda).length > 120) return fel("full");
    } else return fel("op");
    const f = await skriv("filip"); if (f) return f;
    if (ny) efter(olNotis(env, x => !x.ag, {title: "Filip har lagt till en önskning", body: ny.namn, url: "./#sak-" + ny.id, tag: "ol-ny"}));
    return svar(Object.assign({ok: true}, extra));
  }

  if (path === "/onskelista/push"){
    if (!p) return fel("in");
    const P = await olLas(env, "push"), subs = Array.isArray(P.subs) ? P.subs : [], u = b.sub, ag = agare ? 1 : 0;
    const ok = u && typeof u.endpoint === "string" && u.endpoint.length < 600 && OL_PUSHVARD.test(u.endpoint) && u.keys
      && typeof u.keys.p256dh === "string" && u.keys.p256dh.length < 200 && typeof u.keys.auth === "string" && u.keys.auth.length < 80;
    if (!b.av && !ok) return fel("in");
    if (b.av ? !subs.some(x => x.p === p) : subs.some(x => x.p === p && x.e === u.endpoint && x.k === u.keys.p256dh && x.a === u.keys.auth && x.ag === ag)) return json({ol: 1, ok: true});
    P.subs = subs.filter(x => x.p !== p && (b.av || x.e !== u.endpoint));
    if (!b.av){ P.subs.push({e: u.endpoint, k: u.keys.p256dh, a: u.keys.auth, p, ag, t: Date.now()}); while (P.subs.length > OL_MAX_PUSH) P.subs.shift(); }
    const f = await olSpara(env, "push", P); if (f) return fel(f, 429);
    return json({ol: 1, ok: true});
  }
  return fel("path", 404);
}
export default {
  async fetch(request, env, ctx){
    const cors = {
      "Access-Control-Allow-Origin": APP,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, sign, t, nonce, Content-Type, X-GS-Key, X-OL-Key",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (o, status) => new Response(JSON.stringify(o), {status: status || 200, headers: {...cors, "Content-Type": "application/json; charset=utf-8"}});
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
    const url = new URL(request.url);
    if (request.headers.get("Origin") !== APP) return json({message: "not allowed"}, 403);
    if (url.pathname.startsWith("/push/")) return pushApi(request, env, url.pathname, json);
    if (url.pathname === "/onskelista" || url.pathname.startsWith("/onskelista/")) return wishApi(request, env, ctx, url, json).catch(() => json({error: "fel"}, 500));
    if (!/^\/v1\.1\/devices(\/[A-Za-z0-9_-]+\/(commands|status))?$/.test(url.pathname)) return json({message: "not allowed"}, 403);
    const headers = new Headers();
    for (const h of ["Authorization", "sign", "t", "nonce", "Content-Type"]){
      const v = request.headers.get(h);
      if (v) headers.set(h, v);
    }
    const res = await fetch("https://api.switch-bot.com" + url.pathname, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.text() : undefined
    });
    return new Response(await res.text(), {status: res.status, headers: {...cors, "Content-Type": "application/json; charset=utf-8"}});
  },
  async scheduled(event, env, ctx){ const p = tick(env, Number(event && event.scheduledTime) || Date.now()); ctx.waitUntil(p); await p; }
};
