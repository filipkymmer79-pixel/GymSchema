// GymSchema → SwitchBot (Cloudflare Worker)
// SwitchBots moln släpper inte in webbappar direkt (inget CORS). Den här Workern skickar bara
// vidare appens anrop till api.switch-bot.com. Token och secret kommer från appen – inget sparas här.
const APP = "https://filipkymmer79-pixel.github.io";

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": APP,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, sign, t, nonce, Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    const allowed = /^\/v1\.1\/devices(\/[A-Za-z0-9_-]+\/(commands|status))?$/.test(url.pathname);
    if (!allowed || request.headers.get("Origin") !== APP) {
      return new Response('{"message":"not allowed"}', { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const headers = new Headers();
    for (const h of ["Authorization", "sign", "t", "nonce", "Content-Type"]) {
      const v = request.headers.get(h);
      if (v) headers.set(h, v);
    }
    const res = await fetch("https://api.switch-bot.com" + url.pathname, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.text() : undefined
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
    });
  }
};
