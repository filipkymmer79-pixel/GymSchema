// GymSchema-mellanhanden (Cloudflare Worker)
// 1) Gardinen: skickar vidare appens anrop till api.switch-bot.com (SwitchBots moln släpper inte in webbappar).
//    Token och secret kommer från appen och sparas inte här.
// 2) Påminnelser: sparar appens notisschema i KV (bindningen GS) och skickar notiserna med web push.
//    Cron-schemat (varje minut) kollar vad som ska skickas.
// 3) Vilan är slut (version 2): när mobilen låses under vilan lämnar appen en notis med klockslag på sekunden.
//    Cron-körningen stannar kvar den minut den äger, hittar notisen och skickar den precis när vilan är slut.
//    Varje nyckel som används för det läses bara en gång – då kan KV aldrig svara med ett gammalt värde.
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
export default {
  async fetch(request, env){
    const cors = {
      "Access-Control-Allow-Origin": APP,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, sign, t, nonce, Content-Type, X-GS-Key",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (o, status) => new Response(JSON.stringify(o), {status: status || 200, headers: {...cors, "Content-Type": "application/json; charset=utf-8"}});
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
    const url = new URL(request.url);
    if (request.headers.get("Origin") !== APP) return json({message: "not allowed"}, 403);
    if (url.pathname.startsWith("/push/")) return pushApi(request, env, url.pathname, json);
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
