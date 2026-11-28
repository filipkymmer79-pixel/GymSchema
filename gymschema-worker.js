// GymSchema-mellanhanden (Cloudflare Worker)
// 1) Gardinen: skickar vidare appens anrop till api.switch-bot.com (SwitchBots moln släpper inte in webbappar).
//    Token och secret kommer från appen och sparas inte här.
// 2) Påminnelser: sparar appens notisschema i KV (bindningen GS) och skickar notiserna med web push.
//    Cron-schemat (varje minut) kollar vad som ska skickas.
// 3) Vilan är slut (version 2): när mobilen låses under vilan lämnar appen en notis med klockslag på sekunden.
//    Cron-körningen stannar kvar den minut den äger, hittar notisen och skickar den precis när vilan är slut.
//    Varje nyckel som används för det läses bara en gång – då kan KV aldrig svara med ett gammalt värde.
// 4) Önskelistan: vem som köper vad, sakerna Filip lägger till, chatten och notiserna (KV-nycklarna ol:mamma, ol:pappa, ol:annan, ol:filip och ol:push).
// 5) Jobbmotorn (version 3): påminner om Försäkringskassan och aktivitetsrapporten tills Filip bockar av dem i appen.
//    Egen prenumeration och egna nycklar (jm:cfg och jm:sent), så GymSchemas påminnelser påverkas inte.
// 6) Sök nu (version 4): knappen i Jobbmotorn startar Claudes schemalagda uppgift "Jobbmotorn: Sök nu" via dess API.
//    Uppgiftens token sparas bara här i KV (jm:fire), aldrig i appen eller på GitHub.
// 7) AI-luckorna i önskelistan: Claude letar fram nya idéer till adventsluckorna (KV-nycklarna ol:aiko och ol:aivis:*, hemligheten ANTHROPIC_API_KEY).
const V = 4;
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
const OL_V = 3;                                                   // 2: notiser om ångrade köp, Filips ändringar och adventsluckorna, val av notiser och testnotis. 3: AI-luckorna
const OL_SLOTS = ["mamma", "pappa", "annan", "filip"];
const OL_TAK = {mamma: 200, pappa: 200, annan: 150, filip: 120, push: 40, lucka: 8,   // skrivningar per dygn och nyckel (KV-kvoten är 1 000 om dagen)
  aiko: 40, "aivis:mamma": 60, "aivis:pappa": 60, "aivis:annan": 40};
const OL_MAX_KOP = 60, OL_MAX_EGNA = 40, OL_MAX_CHATT = 60, OL_MAX_PUSH = 12, OL_DYGN = 864e5;
const OL_BILDER = ["paket", "matta", "shorts", "airpods", "tofflor", "satoro", "panna", "stekspade", "hantel", "italki", "vinyl", "tungskrapa", "icebug", "hoodie", "dorr", "hopprep", "shaker", "tang", "glas", "borste", "bio", "ljuslist", "halsduk", "balans", "foamroller", "hantelset", "massagebollar", "gymgolv", "boxer"];
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
// Notiser till dem som har slagit på dem. till väljer mottagare, typ är vad det gäller (kop, angra, chatt, filip, lucka, fraga, test),
// och den som har stängt av en typ i inställningarna slipper den. Prenumerationer som push-tjänsten har glömt städas bort.
const OL_TYPER = ["kop", "angra", "chatt", "filip", "lucka"];
const OL_LUCKOR = [["2026-11-29", "Första advent"], ["2026-12-06", "Andra advent"], ["2026-12-13", "Tredje advent"], ["2026-12-20", "Fjärde advent"]];
async function olNotis(env, till, msg, typ){
  const P = await olLas(env, "push"), subs = Array.isArray(P.subs) ? P.subs : [];
  const mot = subs.filter(x => till(x) && !(typ && Array.isArray(x.nej) && x.nej.indexOf(typ) >= 0));
  if (!mot.length) return;
  const st = await Promise.all(mot.map(x => push(env, {endpoint: x.e, keys: {p256dh: x.k, auth: x.a}}, msg, 12 * 3600).catch(() => 0)));
  const dod = mot.filter((x, i) => st[i] === 404 || st[i] === 410);
  if (dod.length){ P.subs = subs.filter(x => dod.indexOf(x) < 0); await olSpara(env, "push", P); }
}
async function olLucka(env, nu){
  if (!env.GS) return;
  const lok = new Date(nu + 3600e3), dag = lok.toISOString().slice(0, 10), tim = lok.getUTCHours();   // svensk vintertid
  const i = OL_LUCKOR.findIndex(x => x[0] === dag);
  if (i < 0 || tim < 9 || tim >= 21) return;
  const L = await olLas(env, "lucka");
  if ((L.sist || 0) > i) return;                                        // redan skickad
  L.sist = i + 1;
  if (await olSpara(env, "lucka", L)) return;
  await olNotis(env, x => !x.ag, {title: OL_LUCKOR[i][1] + ": lucka " + (i + 1) + " är öppen", body: "Bakom den ligger ett par små idéer för ett par hundralappar, om du vill.", url: "./#lucka-" + (i + 1), tag: "ol-lucka-" + (i + 1)}, "lucka");
}
// 7) AI-luckorna (OL_V 3). Varje gång någon öppnar en lucka får den två idéer som ingen har sett förut.
//    Claude letar fram dem i förväg med webbsökning, bara i svenska webbutiker, och lägger dem i en kö per lucka (ol:aiko).
//    Cron-körningen fyller på varannan minut: sex idéer åt gången i den lucka där färre än fyra väntar, högst åtta
//    omgångar om dygnet. Den som öppnar en lucka tar de två första som ingen har sett och skriver dem i sin egen historik
//    (ol:aivis:mamma, ol:aivis:pappa och ol:aivis:annan – var och en sin nyckel, precis som köpen). En idé som har visats
//    kommer aldrig tillbaka som ny, men alla ser den under Tidigare idéer. Länken måste finnas i Claudes egna sökresultat
//    och höra till en av butikerna nedan, så den kan inte vara påhittad. Nyckeln till Claude ligger som hemlighet
//    (ANTHROPIC_API_KEY) i workerns inställningar, aldrig i koden. Utan den visar luckorna de inbyggda idéerna som förut.
const OL_AI_MODELL = "claude-sonnet-5-5";
const OL_AI_PER = 6, OL_AI_MIN = 4, OL_AI_TAK = 8, OL_AI_HIST = 400, OL_AI_SETT = 150;
const OL_AI_SLUT = "2026-12-25";                                  // efter julafton letar den inte mer
const OL_AI_VEM = ["mamma", "pappa", "annan"];
const OL_AI_PRIS = {in: 2, ut: 10, sok: 0.01, kr: 10.5};         // dollar per miljon tokens in och ut och per sökning, och ungefär kronor per dollar
const OL_AI_TEMA = {
  1: "Rör på dig: träning hemma och på gym – styrka, rörlighet, hållning, mage, säte och återhämtning. Inga kosttillskott.",
  2: "Till köket: redskap och små saker utan teflon och utan plast som rör maten – rostfritt stål, gjutjärn, kolstål, glas, trä och keramik.",
  3: "Skivor och film: vinyl och skivspelaren, filmkvällar (gärna A24 och uppväxtfilmer), bio, analoga kameror och film till dem.",
  4: "Hemma: ett mysigt och smart rum – smarta prylar som fungerar med Home Assistant (Zigbee, Philips Hue, Tapo, SwitchBot), belysning, Arsenal och sådant som gör rummet fint."
};
const OL_AI_BUTIKER = ["gymgrossisten.com", "mmsports.se", "stadium.se", "xxl.se", "intersport.se", "boozt.com/se",
  "kitchenlab.se", "kitchentime.se", "cervera.se", "designtorget.se", "nordicnest.se", "royaldesign.se", "ahlens.se", "ikea.com/se",
  "clasohlson.com/se", "kjell.com/se", "webhallen.com/se", "elgiganten.se", "netonnet.se", "inet.se", "komplett.se", "jula.se", "biltema.se",
  "svalander.se", "ginza.se", "bengans.se", "scandinavianphoto.se", "cyberphoto.se", "fotokungen.se", "adlibris.com/se", "bokus.com",
  "supporterprylar.se", "coolstuff.se"];
const OL_AI_BILDER = {paket: "ett inslaget paket, för allt som inte har en egen bild", hantel: "hantel eller vikter", hantelset: "hantelställ", hopprep: "hopprep",
  shaker: "shaker eller flaska i stål", gluteband: "träningsband", maghjul: "maghjul", foamroller: "massagerulle", massagebollar: "massagebollar", balans: "balansbräda",
  matta: "yoga- eller träningsmatta", gymgolv: "golvplattor till gym", panna: "stekpanna, gryta eller kastrull", stekspade: "stekspade, slev eller annat köksredskap",
  tang: "tång", glas: "dricksglas eller karaff", rivjarn: "rivjärn, skalare eller annat litet köksverktyg", skarbrada: "skär- eller serveringsbräda i trä", mugg: "mugg eller kopp",
  vinyl: "vinylskiva", fickor: "skivfickor eller förvaring för skivor", borste: "borste eller rengöring för skivor", bio: "biobiljett eller film", kamera: "kamera eller film till en kamera",
  airpods: "hörlurar", ljuslist: "LED-list eller annan belysning", uttag: "smart kontakt eller annan smart pryl", halsduk: "halsduk, mössa eller filt"};
const OL_AI_KANDA = ["yogamatta (Manduka PRO)", "löparshorts", "AirPods Pro 3", "sherpatofflor", "merinotröja", "stekpanna (Demeyere)", "perforerad stekspade (Cristel)",
  "ställbar hantel", "presentkort på italki", "vinylskiva TV Girl – Death of a Party Girl", "tungskrapa i koppar", "löparskor (Icebug)", "hoodie (Gymshark)", "balansbräda",
  "foam roller", "hantelpaket med ställ", "massagebollar", "gymgolv i gummi", "boxer (Craft)", "hopprep (Everlast)", "shaker i stål (Smartshake)", "träningsband (MM Sports Glute Band)",
  "maghjul", "kökstång (Zwilling)", "dricksglas (Duralex Picardie)", "rivjärn (Microplane)", "skärbräda i bok", "skivborste (Pro-Ject)", "presentkort på bio", "engångskamera (Kodak)",
  "innerfickor för vinyl", "ljuslist (Tapo)", "Arsenal-halsduk", "smart kontakt (Tapo P115)", "Arsenal-mugg"];
const aiNorm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
function aiUrl(u){                                                // samma sida oavsett www, snedstreck på slutet, frågetecken och ankare
  try { const x = new URL(String(u)); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase(); } catch(e){ return ""; }
}
const aiButik = u => OL_AI_BUTIKER.some(d => {
  const del = d.split("/"), host = u.hostname.replace(/^www\./, "").toLowerCase(), vag = del.length > 1 ? "/" + del.slice(1).join("/") : "";
  return (host === del[0] || host.endsWith("." + del[0])) && (!vag || u.pathname.toLowerCase().startsWith(vag));
});
const aiId = () => "ai-" + Array.from(crypto.getRandomValues(new Uint8Array(9)), x => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("");
async function aiKo(env){
  const K = await olLas(env, "aiko"), ko = K.ko && typeof K.ko === "object" ? K.ko : {};
  K.ko = {}; [1, 2, 3, 4].forEach(n => { K.ko[n] = Array.isArray(ko[n]) ? ko[n] : []; });
  K.m = K.m && typeof K.m === "object" ? K.m : {};
  return K;
}
async function aiHist(env){
  const L = await Promise.all(OL_AI_VEM.map(v => olLas(env, "aivis:" + v))), per = {}, ids = new Set(), saker = [];
  OL_AI_VEM.forEach((v, i) => { per[v] = L[i]; (Array.isArray(L[i].s) ? L[i].s : []).forEach(s => { if (s && s.id && !ids.has(s.id)){ ids.add(s.id); saker.push(s); } }); });
  saker.sort((a, b) => (a.v || 0) - (b.v || 0));
  return {per, ids, saker, rev: L.map(x => x.r || 0).join(".")};
}
// Det appen får veta om en idé
const aiUt = s => ({id: s.id, lucka: s.lucka, t: s.t, bild: s.bild, namn: s.namn, hos: s.hos, butik: s.butik, pris: s.pris, var: s.var || undefined, url: s.url, fakta: s.fakta, rim: s.rim, v: s.v || 0});
async function aiInfo(env, kand, agare){
  const H = await aiHist(env), o = {pa: !!env.ANTHROPIC_API_KEY, rev: H.rev};
  if (kand !== H.rev) o.saker = H.saker.map(aiUt);
  if (agare){                                                     // bara Filip: hur det går
    const K = await aiKo(env), idag = new Date(Date.now() + 3600e3).toISOString().slice(0, 10);
    o.status = {vantar: [1, 2, 3, 4].map(n => K.ko[n].filter(s => !H.ids.has(s.id)).length), idag: K.m.dag === idag ? K.m.antal || 0 : 0, tak: OL_AI_TAK,
      kr: Math.round((K.m.usd || 0) * OL_AI_PRIS.kr), fel: K.m.fel || "", felT: K.m.felT || 0, senast: K.m.senast || 0, visade: H.saker.length};
  }
  return o;
}
// En omgång: Claude söker i butikerna och lämnar idéerna genom verktyget spara_ideer
async function aiFraga(env, nr, uteslut){
  const spara = {name: "spara_ideer", description: "Sparar idéerna. Anropa en enda gång, när du har hittat alla.", input_schema: {type: "object", required: ["ideer"], properties: {ideer: {type: "array", items: {type: "object",
    required: ["namn", "marke", "butik", "url", "pris", "fakta", "rim", "bild"], properties: {
      namn: {type: "string", description: "Märke, modell och vad det är, som \"Everlast Speed Rope, hopprep\""},
      marke: {type: "string"}, butik: {type: "string", description: "Butikens namn, som \"Clas Ohlson\""},
      url: {type: "string", description: "Produktsidan, exakt som i sökresultaten"},
      pris: {type: "integer", description: "Priset nu, i hela kronor"},
      var: {type: "integer", description: "Ordinarie pris om varan är nedsatt, annars 0"},
      fakta: {type: "string"}, rim: {type: "string"}, bild: {type: "string", enum: Object.keys(OL_AI_BILDER)}}}}}}};
  const system = [
    "Du letar fram små julklappar till en ung man i Umeå. Hans mamma och pappa ser dem bakom en adventslucka i hans önskelista.",
    "Han gillar styrketräning (hållning, mage, säte och rörlighet), ett giftfritt kök (rostfritt stål, gjutjärn, glas, trä och keramik, inget teflon och ingen plast som rör maten), vinyl och sin skivspelare, film (A24 och uppväxtfilmer), analoga kameror och retrokameror, smarta hem med Home Assistant (Zigbee, Philips Hue, Tapo, SwitchBot), Arsenal och lugn skandinavisk stil.",
    "Varje idé ska vara en bestämd produkt som går att köpa nu i en av de svenska webbutiker du kan söka i, och kosta mellan 100 och 500 kr.",
    "Aldrig: mat, godis, dryck, kosttillskott, hudvård, hygien, smink, parfym, kläder eller skor i storlekar, presentkort, alkohol, tobak, plast som rör mat eller dryck, teflon, begagnat eller sådant som kan vara farligt.",
    "Sök med web_search. Ta bara produktsidor som finns i sökresultaten och skriv av länken exakt. Välj varor som verkar finnas i lager.",
    "Gör idéerna olika varandra: olika sorters saker, gärna från olika butiker.",
    "fakta: en eller två korta, konkreta meningar om vad det är och vad det är bra till, till exempel material, storlek och användning. Inga utropstecken och inga överord.",
    "rim: ett julklappsrim på svenska, två korta rader som rimmar, med radbrytning emellan. Det ska antyda saken utan att säga vad den är, i samma ton som \"Hoppa högt och hoppa lätt –\\npulsen stiger på rätt sätt.\"",
    "bild: den teckning som passar bäst. " + Object.entries(OL_AI_BILDER).map(([k, v]) => k + " = " + v).join("; ") + ".",
    "Anropa spara_ideer en enda gång när du är klar."
  ].join("\n");
  const fraga = "Lucka " + nr + ". " + OL_AI_TEMA[nr] + "\nHitta " + OL_AI_PER + " idéer.\n\nDet här finns redan i listan eller har redan visats. Föreslå inte samma saker igen, och inte heller samma sorts saker:\n- " + uteslut.join("\n- ");
  const bas = {model: OL_AI_MODELL, max_tokens: 6000, system, tools: [
    {type: "web_search_20250305", name: "web_search", max_uses: 6, allowed_domains: OL_AI_BUTIKER, user_location: {type: "approximate", city: "Umeå", region: "Västerbotten", country: "SE", timezone: "Europe/Stockholm"}},
    spara]};
  const msgs = [{role: "user", content: fraga}], urls = new Set();
  let svar = [], input = null, usd = 0, text = "", varv = 0;
  while (varv++ < 4){
    const r = await fetch("https://api.anthropic.com/v1/messages", {method: "POST", signal: AbortSignal.timeout(170e3),
      headers: {"x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2026-10-21", "content-type": "application/json"},
      body: JSON.stringify(Object.assign({messages: svar.length ? msgs.concat([{role: "assistant", content: svar}]) : msgs}, bas))});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("Claude svarade " + r.status + (j.error && j.error.message ? ": " + j.error.message : ""));
    const u = j.usage || {};
    usd += ((u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) / 10) * OL_AI_PRIS.in / 1e6
      + (u.output_tokens || 0) * OL_AI_PRIS.ut / 1e6 + ((u.server_tool_use || {}).web_search_requests || 0) * OL_AI_PRIS.sok;
    for (const blk of Array.isArray(j.content) ? j.content : []){
      if (blk.type === "web_search_tool_result" && Array.isArray(blk.content)) blk.content.forEach(x => { if (x && x.url) urls.add(aiUrl(x.url)); });
      if (blk.type === "text"){ text += blk.text || ""; (blk.citations || []).forEach(c => { if (c && c.url) urls.add(aiUrl(c.url)); }); }
      if (blk.type === "tool_use" && blk.name === "spara_ideer") input = blk.input;
    }
    if (input || j.stop_reason !== "pause_turn") break;
    svar = svar.concat(j.content || []);                          // en lång sökning som pausades: skicka tillbaka den så fortsätter Claude
  }
  let ideer = input && Array.isArray(input.ideer) ? input.ideer : null;
  if (!ideer){ try { const m = text.match(/\[[\s\S]*\]/); ideer = m ? JSON.parse(m[0]) : null; } catch(e){} }
  if (!Array.isArray(ideer)) throw new Error("Claude lämnade inga idéer den här gången.");
  return {ideer, urls, usd};
}
// Granskar en idé: länken från sökresultaten och en av butikerna, rimligt pris, två rader rim och inget som redan finns
function aiRensa(x, nr, urls, sett){
  if (!x || typeof x !== "object") return null;
  const namn = olText(x.namn, 80), marke = olText(x.marke, 40), butik = olText(x.butik, 40), fakta = olText(x.fakta, 260);
  const rim = String(x.rim == null ? "" : x.rim).replace(/\\n/g, "\n").split(/\n+|\s\/\s/).map(r => olText(r, 70)).filter(Boolean);
  let u = null; try { u = new URL(String(x.url || "").trim()); } catch(e){}
  if (!u || u.protocol !== "https:" || !aiButik(u)) return null;
  const nyckel = aiUrl(u.href), pris = Math.round(Number(x.pris)), forr = Math.round(Number(x.var)) || 0, n = aiNorm(namn);
  if (!urls.has(nyckel) || !(pris >= 49 && pris <= 600) || namn.length < 4 || !butik || fakta.length < 12 || rim.length !== 2) return null;
  if (sett.has(n) || sett.has(nyckel)) return null;
  sett.add(n); sett.add(nyckel);
  return {id: aiId(), lucka: nr, t: Math.floor(Math.random() * 4), bild: Object.prototype.hasOwnProperty.call(OL_AI_BILDER, x.bild) ? x.bild : "paket", namn,
    hos: (marke && marke.toLowerCase() !== butik.toLowerCase() ? marke + ", hos " : "Hos ") + butik, butik, pris, var: forr > pris ? forr : undefined,
    url: u.href, fakta, rim: rim.join("\n"), k: Date.now()};
}
// Cron: fyll på den lucka där minst väntar
async function aiFyll(env, nu){
  if (!env.GS || !env.ANTHROPIC_API_KEY) return;
  if (Math.floor(nu / 60e3) % 2) return;                          // varannan minut räcker
  const idag = new Date(nu + 3600e3).toISOString().slice(0, 10);
  if (idag >= OL_AI_SLUT) return;
  if (await env.GS.get("ol:ailas")) return;                       // en omgång pågår redan
  const [K, H] = await Promise.all([aiKo(env), aiHist(env)]);
  if (K.m.dag === idag && (K.m.antal || 0) >= OL_AI_TAK) return;
  if (K.m.felT && nu - K.m.felT < 20 * 60e3) return;             // vänta en stund efter ett fel
  [1, 2, 3, 4].forEach(n => { K.ko[n] = K.ko[n].filter(s => !H.ids.has(s.id)); });
  const nr = [1, 2, 3, 4].filter(n => K.ko[n].length < OL_AI_MIN).sort((a, b) => K.ko[a].length - K.ko[b].length)[0];
  if (!nr) return;
  await env.GS.put("ol:ailas", String(nu), {expirationTtl: 300});
  const F = await olLas(env, "filip"), sett = new Set(), uteslut = OL_AI_KANDA.slice();
  OL_AI_KANDA.forEach(x => sett.add(aiNorm(x)));
  H.saker.concat(K.ko[1], K.ko[2], K.ko[3], K.ko[4]).forEach(s => { uteslut.push(s.namn); sett.add(aiNorm(s.namn)); sett.add(aiUrl(s.url)); });
  (Array.isArray(F.egna) ? F.egna : []).forEach(e => { if (e && e.namn){ uteslut.push(olText(e.namn, 60)); sett.add(aiNorm(e.namn)); } });
  if (K.m.dag === idag) K.m.antal = (K.m.antal || 0) + 1; else { K.m.dag = idag; K.m.antal = 1; }
  try {
    const R = await aiFraga(env, nr, uteslut.slice(-250));
    const nya = R.ideer.map(x => aiRensa(x, nr, R.urls, sett)).filter(Boolean).slice(0, OL_AI_PER);
    K.ko[nr] = K.ko[nr].concat(nya);
    K.m.usd = (K.m.usd || 0) + R.usd; K.m.senast = nu; K.m.ideer = (K.m.ideer || 0) + nya.length;
    if (nya.length){ K.m.fel = ""; K.m.felT = 0; }
    else { K.m.fel = "Claude hittade inga idéer som klarade kontrollen."; K.m.felT = nu; }
  } catch(e){
    K.m.fel = olText(e && e.message, 200) || "Okänt fel"; K.m.felT = nu;
  }
  await olSpara(env, "aiko", K);
  try { await env.GS.delete("ol:ailas"); } catch(e){}               // nästa lucka kan fyllas på redan nästa varv
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
    return json(Object.assign({ol: 1, nv: OL_V, rev, slots, t: Date.now()}, agare ? {agare: true} : null, extra || null), status);
  };
  if (GET){
    if (path !== "/onskelista") return fel("path", 404);
    // a: den version av AI-historiken appen redan har, så att den bara skickas när något har hänt
    return svar({ai: await aiInfo(env, String(url.searchParams.get("a") || ""), agare)});
  }
  const d = typeof b.d === "string" && /^[A-Za-z0-9_-]{16,40}$/.test(b.d) ? b.d : "";
  const p = d ? (await sha(d)).slice(0, 12) : "";
  const vem = agare ? "filip" : (["mamma", "pappa", "annan"].indexOf(b.vem) >= 0 ? b.vem : "");
  const namn = vem === "annan" ? olText(b.namn, 16) : "";
  const id = olId(b.id);
  // i mammas och pappas nyckel är allt deras eget; i ol:annan skiljs folk åt på mobilens avtryck eller namnet de har skrivit
  const min = x => x.p === p || vem === "mamma" || vem === "pappa" || vem === "filip" || (!!namn && x.n === namn);
  const skriv = async k => { const f = await olSpara(env, k, S[k]); return f ? fel(f, 429) : null; };
  const efter = jobb => { const j = jobb.catch(() => {}); if (ctx && ctx.waitUntil) ctx.waitUntil(j); return j; };

  if (path === "/onskelista/ai"){                                         // två idéer i en lucka som ingen har sett förut
    if (agare) return fel("agare");                                       // Filip ser alla, men tar inga ur kön
    const nr = Math.round(Number(b.nr));
    if (!(nr >= 1 && nr <= 4)) return fel("in");
    const v = OL_AI_VEM.indexOf(vem) >= 0 ? vem : "annan";
    const [K, H] = await Promise.all([aiKo(env), aiHist(env)]), sett = new Set(H.ids);
    // det mobilen redan har sett följer med, ifall KV skulle svara med en lite för gammal historik
    (Array.isArray(b.sett) ? b.sett : []).slice(-OL_AI_SETT).forEach(x => { const y = olId(x); if (y) sett.add(y); });
    const nya = K.ko[nr].filter(s => !sett.has(s.id)).slice(0, 2);
    if (!nya.length) return json({ol: 1, nv: OL_V, tom: true, pa: !!env.ANTHROPIC_API_KEY});
    const mitt = H.per[v], nu = Date.now();
    mitt.s = (Array.isArray(mitt.s) ? mitt.s : []).concat(nya.map(s => Object.assign({}, s, {v: nu}))).slice(-OL_AI_HIST);
    const f = await olSpara(env, "aivis:" + v, mitt); if (f) return fel(f, 429);
    return json({ol: 1, nv: OL_V, nya: nya.map(s => aiUt(Object.assign({}, s, {v: nu})))});
  }

  if (path === "/onskelista/kop"){
    if (agare || !id || !p || !vem) return fel("in");
    let angrat = false;
    const s = S[vem], kopt = s.kopt || (s.kopt = {}), borta = s.borta || (s.borta = {}), har = kopt[id];
    if (b.av){
      if (!har || !min(har)) return svar({ok: true, du: p});              // inte din markering: inget att ta bort
      if (!b.tyst) angrat = true;                                          // tyst: appen städar själv, ingen har ångrat något
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
    // sak: sakens id, låst med köparnas lösenord, så att bara deras mobiler kan skriva ut vilken sak det är
    if (!b.av && !b.tyst) efter(olNotis(env, x => !x.ag && x.p !== p, {title: olNamn(vem, namn) + " köper en sak", body: olText(b.sak, 80) || "Öppna listan och se vilken.", url: "./#sak-" + id, tag: "ol-k-" + id}, "kop"));
    if (angrat) efter(olNotis(env, x => !x.ag && x.p !== p, {title: olNamn(vem, namn) + " köper inte en sak längre", body: olText(b.sak, 80) || "Den är ledig igen. Öppna listan och se vilken.", url: "./#sak-" + id, tag: "ol-k-" + id}, "angra"));
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
      efter(olNotis(env, x => !x.ag && x.p !== p, {title: agare ? "Filip svarar" : olNamn(vem, namn) + (sist.f ? " frågar Filip" : " skriver"), body: text(sist), url: "./#chatt", tag: "ol-c"}, "chatt"));
      if (tillF) efter(olNotis(env, x => !!x.ag && x.p !== p, {title: olNamn(vem, namn) + " frågar dig", body: text(tillF), url: "./#chatt", tag: "ol-c"}, "fraga"));
    }
    return svar({ok: true, du: p});
  }

  if (path === "/onskelista/lista"){
    if (!agare) return fel("agare", 403);
    if (b.op === "hej") return svar({ok: true});
    const s = S.filip, egna = Array.isArray(s.egna) ? s.egna : (s.egna = []), lappar = s.lappar || (s.lappar = {}), dolda = s.dolda || (s.dolda = {});
    let ny = null, extra = null, andrat = null;
    const rubrik = olText(b.rubrik, 80), egenNamn = x => (egna.find(e => e.id === x) || {}).namn || rubrik;
    if (b.op === "ny" || b.op === "andra"){
      const i = b.op === "andra" ? egna.findIndex(e => e.id === id) : -1, k = b.sak && typeof b.sak === "object" ? b.sak : {};
      const sakNamn = olText(k.namn, 80), lank = olText(k.url, 400), pris = Number(k.pris), lucka = Number(k.lucka);
      if (!sakNamn || !/^https:\/\/[^\s/]+\.[^\s/]+/.test(lank) || (b.op === "andra" && i < 0)) return fel("in");
      if (i < 0 && egna.length >= OL_MAX_EGNA) return fel("full");
      const e = {id: i < 0 ? "e" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36) : id, namn: sakNamn, url: lank,
        pris: k.pris != null && k.pris !== "" && Number.isFinite(pris) && pris > 0 && pris < 1e7 ? Math.round(pris) : null,
        butik: olText(k.butik, 40), lapp: olText(k.lapp, 160), bild: OL_BILDER.indexOf(k.bild) >= 0 ? k.bild : "paket",
        lucka: lucka >= 1 && lucka <= 4 ? Math.floor(lucka) : 0, t: i < 0 ? Date.now() : egna[i].t};
      if (i < 0){ egna.push(e); ny = e; } else { egna[i] = e; andrat = {title: "Filip har ändrat en önskning", body: e.namn}; }
      extra = {id: e.id};
    } else if (!id) return fel("in");
    else if (b.op === "bort"){ andrat = {title: "Filip har tagit bort en önskning", body: egenNamn(id)}; s.egna = egna.filter(e => e.id !== id); delete lappar[id]; delete dolda[id]; }
    else if (b.op === "lapp"){
      if (typeof b.text === "string") lappar[id] = olText(b.text, 160); else delete lappar[id];     // tom text: ingen lapp alls
      andrat = lappar[id] ? {title: "Filip har skrivit en lapp", body: (egenNamn(id) ? egenNamn(id) + ": " : "") + lappar[id]} : {title: "Filip har tagit bort en lapp", body: egenNamn(id)};
      if (Object.keys(lappar).length > 120) return fel("full");
    } else if (b.op === "dolj"){
      if (b.dold) dolda[id] = 1; else delete dolda[id];
      andrat = {title: b.dold ? "Filip har tagit bort en önskning" : "Filip har lagt tillbaka en önskning", body: egenNamn(id)};
      if (Object.keys(dolda).length > 120) return fel("full");
    } else return fel("op");
    const f = await skriv("filip"); if (f) return f;
    if (ny) efter(olNotis(env, x => !x.ag, {title: "Filip har lagt till en önskning", body: ny.namn, url: "./#sak-" + ny.id, tag: "ol-ny"}, "filip"));
    if (andrat && !b.tyst) efter(olNotis(env, x => !x.ag, {title: andrat.title, body: olText(andrat.body, 140) || "Öppna listan och se vad.", url: "./#sak-" + id, tag: "ol-a-" + id}, "filip"));
    return svar(Object.assign({ok: true}, extra));
  }

  if (path === "/onskelista/push"){
    if (!p) return fel("in");
    const P = await olLas(env, "push"), subs = Array.isArray(P.subs) ? P.subs : [], u = b.sub, ag = agare ? 1 : 0;
    const nej = Array.isArray(b.nej) ? OL_TYPER.filter(t => b.nej.indexOf(t) >= 0) : null;
    if (b.test){                                                           // en notis till den här mobilen, för att se att det fungerar
      const mina = subs.filter(x => x.p === p);
      if (!mina.length) return fel("ingen", 404);
      await olNotis(env, x => x.p === p, {title: "Det fungerar", body: "Så här ser notiserna från önskelistan ut.", url: "./", tag: "ol-test"});
      return json({ol: 1, nv: OL_V, ok: true});
    }
    if (nej && !u && !b.av){                                               // bara valen ändras
      if (!subs.some(x => x.p === p)) return fel("ingen", 404);
      P.subs = subs.map(x => { if (x.p !== p) return x; const y = Object.assign({}, x); if (nej.length) y.nej = nej; else delete y.nej; return y; });
      const f = await olSpara(env, "push", P); if (f) return fel(f, 429);
      return json({ol: 1, nv: OL_V, ok: true});
    }
    const ok = u && typeof u.endpoint === "string" && u.endpoint.length < 600 && OL_PUSHVARD.test(u.endpoint) && u.keys
      && typeof u.keys.p256dh === "string" && u.keys.p256dh.length < 200 && typeof u.keys.auth === "string" && u.keys.auth.length < 80;
    if (!b.av && !ok) return fel("in");
    const gammal = subs.find(x => x.p === p), valen = nej || (gammal && gammal.nej) || [];
    if (b.av ? !gammal : subs.some(x => x.p === p && x.e === u.endpoint && x.k === u.keys.p256dh && x.a === u.keys.auth && x.ag === ag && (x.nej || []).join() === valen.join())) return json({ol: 1, nv: OL_V, ok: true});
    P.subs = subs.filter(x => x.p !== p && (b.av || x.e !== u.endpoint));
    if (!b.av){ P.subs.push(Object.assign({e: u.endpoint, k: u.keys.p256dh, a: u.keys.auth, p, ag, t: Date.now()}, valen.length ? {nej: valen} : null)); while (P.subs.length > OL_MAX_PUSH) P.subs.shift(); }
    const f = await olSpara(env, "push", P); if (f) return fel(f, 429);
    return json({ol: 1, nv: OL_V, ok: true});
  }
  return fel("path", 404);
}
// 5) Jobbmotorn (GymSchema/jobb/): appen räknar ut när den ska påminna och lämnar listan här. Bockar Filip av en
//    rapport skickar appen en ny lista utan den. Samma web push och samma VAPID-nyckel som GymSchemas påminnelser.
async function jmApi(request, env, path, json){
  if (!env.GS) return json({error: "kv"}, 503);
  if (request.method !== "POST") return json({error: "method"}, 405);
  let b = {}; try { b = JSON.parse(await request.text()) || {}; } catch(e){}
  const key = request.headers.get("X-GS-Key") || "";
  if (key.length < 20) return json({error: "key"}, 400);
  if (path.startsWith("/push/jm/fire")) return jmFire(env, path, b, await sha(key), json);
  const kh = await sha(key), cfg = await env.GS.get("jm:cfg", "json");
  const sub = b && b.sub && typeof b.sub.endpoint === "string" && /^https:\/\//.test(b.sub.endpoint) && b.sub.keys && b.sub.keys.p256dh && b.sub.keys.auth ? b.sub : null;
  if (cfg && cfg.kh !== kh && !(sub && cfg.sub && sub.endpoint === cfg.sub.endpoint)) return json({error: "taken"}, 409);
  if (path === "/push/jm/save"){
    if (!sub) return json({error: "sub"}, 400);
    const events = (Array.isArray(b.events) ? b.events : []).filter(e => e && typeof e.at === "number" && e.title).slice(0, 400)
      .map(e => ({id: String(e.id || e.at).slice(0, 60), at: e.at, title: String(e.title).slice(0, 90), body: String(e.body || "").slice(0, 300), url: String(e.url || "./").slice(0, 80), tag: String(e.tag || "").slice(0, 40)}));
    await env.GS.put("jm:cfg", JSON.stringify({kh, sub: {endpoint: sub.endpoint, keys: {p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth)}}, events}));
    return json({ok: true, n: events.length, cron: Number(await env.GS.get("cron")) || 0, v: V});
  }
  if (path === "/push/jm/test"){
    if (!cfg) return json({error: "off"}, 404);
    const st = await push(env, cfg.sub, {title: "Påminnelserna funkar ✓", body: "Så här påminner Jobbmotorn dig om rapporterna.", url: "./#rapporter", tag: "jm-test"});
    if (st === 404 || st === 410) await env.GS.delete("jm:cfg");
    return json({ok: st >= 200 && st < 300, status: st});
  }
  if (path === "/push/jm/off"){ if (cfg) await env.GS.delete("jm:cfg"); return json({ok: true}); }
  return json({error: "path"}, 404);
}
// Sök nu: sparar uppgiftens id och token (setup), säger om det är klart (status) och startar en körning (fire).
async function jmFire(env, path, b, kh, json){
  const f = await env.GS.get("jm:fire", "json");
  if (f && f.kh !== kh) return json({error: "taken"}, 409);
  if (path === "/push/jm/fire/setup"){
    const id = String(b.id || ""), token = String(b.token || "").trim();
    if (!/^trig_[A-Za-z0-9]{8,60}$/.test(id)) return json({error: "id"}, 400);
    if (!/^sk-ant-[A-Za-z0-9_-]{20,300}$/.test(token)) return json({error: "token"}, 400);
    await env.GS.put("jm:fire", JSON.stringify({kh, id, token, last: f ? f.last || 0 : 0}));
    return json({ok: true, v: V});
  }
  if (path === "/push/jm/fire/status") return json({ok: true, set: !!(f && f.token), last: f ? f.last || 0 : 0, v: V});
  if (path === "/push/jm/fire/off"){ if (f) await env.GS.delete("jm:fire"); return json({ok: true}); }
  if (path === "/push/jm/fire"){
    if (!f || !f.token) return json({error: "setup"}, 404);
    const now = Date.now();
    if (now - (f.last || 0) < 120e3) return json({error: "wait", wait: Math.ceil((120e3 - (now - f.last)) / 1000)}, 429);
    const n = Math.max(1, Math.min(15, Math.round(Number(b.n) || 6)));
    const when = new Date(now).toLocaleTimeString("sv-SE", {timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit"});
    f.last = now; await env.GS.put("jm:fire", JSON.stringify(f));
    let r;
    try {
      r = await fetch("https://api.anthropic.com/v1/claude_code/routines/" + f.id + "/fire", {method: "POST", headers: {"Authorization": "Bearer " + f.token, "anthropic-version": "2026-10-21", "Content-Type": "application/json"},
        body: JSON.stringify({text: "antal: " + n + "\nStartad med knappen Sök jobb nu i Jobbmotorn kl " + when + "."})});
    } catch(e){ f.last = 0; await env.GS.put("jm:fire", JSON.stringify(f)); return json({error: "net"}, 502); }
    let j = null; try { j = await r.json(); } catch(e){}
    if (r.ok) return json({ok: true, n, url: j && j.claude_code_session_url || ""});
    f.last = 0; await env.GS.put("jm:fire", JSON.stringify(f));
    if (r.status === 401) return json({error: "token"}, 401);
    if (r.status === 429) return json({error: "limit"}, 429);
    return json({error: "fire", status: r.status, msg: j && j.error && j.error.message || ""}, 502);
  }
  return json({error: "path"}, 404);
}
async function jmTick(env){
  if (!env.GS) return;
  const cfg = await env.GS.get("jm:cfg", "json");
  if (!cfg || !cfg.sub || !Array.isArray(cfg.events)) return;
  const now = Date.now(), due = cfg.events.filter(e => e.at <= now + 20e3 && now - e.at < 15 * 60e3);
  if (!due.length) return;
  const sent = (await env.GS.get("jm:sent", "json")) || {}, todo = due.filter(e => !sent[e.id]);
  if (!todo.length) return;
  for (const e of todo){
    const st = await push(env, cfg.sub, {title: e.title, body: e.body, url: e.url, tag: e.tag || e.id});
    if (st === 404 || st === 410){ await env.GS.delete("jm:cfg"); return; }
    sent[e.id] = now;
  }
  for (const k in sent) if (now - sent[k] > 3 * 864e5) delete sent[k];
  await env.GS.put("jm:sent", JSON.stringify(sent));
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
    if (url.pathname.startsWith("/push/jm/")) return jmApi(request, env, url.pathname, json);
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
  async scheduled(event, env, ctx){
    const t = Number(event && event.scheduledTime) || Date.now();
    const p = Promise.all([tick(env, t), olLucka(env, t).catch(() => {}), jmTick(env).catch(() => {}), aiFyll(env, t).catch(() => {})]);
    ctx.waitUntil(p); await p;
  }
};
