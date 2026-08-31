# DSR Dashboard — data relay (Cloudflare Worker)

Yahoo Finance blocks browser requests (CORS). The app relays them through a
proxy. The free public proxies it ships with are unreliable — when they're
down, Markets/Portfolio show cached or SAMPLE data.

This is a tiny Cloudflare Worker that does the relay itself. Free tier =
100,000 requests/day (the app uses a few dozen). Setup is ~10 minutes, once.

---

## 1. Create the Worker

1. Sign up / log in: **https://dash.cloudflare.com/sign-up** (free, no card).
2. In the dashboard sidebar: **Compute (Workers)** → **Workers & Pages** →
   **Create application** → **Create Worker**.
3. Name it `dsr-yahoo` (the URL becomes
   `https://dsr-yahoo.<your-subdomain>.workers.dev`). **Deploy**.
4. Click **Edit code**, select all, delete, paste the code below, then
   **Deploy** again.

```js
export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const target = new URL(request.url).searchParams.get("url");
    if (!target || !/^https:\/\/(query[12]\.finance|[a-z0-9.]+\.)?yahoo\.com\//i.test(target)) {
      return new Response("bad or missing ?url=", { status: 400, headers: cors });
    }

    let upstream;
    try {
      upstream = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DSRDashboard/1",
          "Accept": "application/json,text/plain,*/*",
        },
        cf: { cacheTtl: 20, cacheEverything: true },
      });
    } catch (e) {
      return new Response("upstream fetch failed: " + e, { status: 502, headers: cors });
    }

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Cache-Control": "public, max-age=20",
      },
    });
  },
};
```

---

## 2. Point the app at it

1. Copy your Worker URL, e.g. `https://dsr-yahoo.dsr.workers.dev`
2. Open the app → **⚙ Settings** → **Data relay** → paste the URL
3. Tap **Test relay** — it should say *"Relay works — NDQ.AX $59.xx"*
4. Tap **Save**

The URL is stored on the device only (localStorage). "Reset all to defaults"
does **not** clear it. No code change or redeploy of the app is needed.

---

## Quick check

Open this in a browser (substitute your subdomain) — you should see raw JSON:

```
https://dsr-yahoo.<your-subdomain>.workers.dev/?url=https://query1.finance.yahoo.com/v8/finance/chart/NDQ.AX?interval=1m%26range=1d
```
