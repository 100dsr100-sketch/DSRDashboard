# DSR Dashboard — data relay (Cloudflare Worker)

Yahoo Finance blocks browser requests (CORS). The app relays them through a
proxy. The free public proxies it ships with are unreliable — when they're
down, Markets/Portfolio show cached or SAMPLE data.

The fix is a tiny Cloudflare Worker that does the relay itself. It runs on
the **same free Cloudflare account** as the LiveChat translit worker
(`100dsr100@gmail.com`, subdomain `100dsr100`) — nothing new to sign up for.
It's a **separate worker** (`dsr-yahoo`), so it can't affect LiveChat.

Free tier = 100,000 requests/day; the app uses a few dozen.

---

## Deploy (one command)

The worker is ready in the [`worker/`](worker/) folder. From a terminal on
the PC that has wrangler logged in for this account:

```
cd "C:\HTML Apps\DSR Dashboard\worker"
npx wrangler deploy
```

That publishes it at:

```
https://dsr-yahoo.100dsr100.workers.dev
```

The app (v1f+) is **already pre-set** to use that URL — no further step.
If wrangler isn't logged in: `npx wrangler login` first.

To redeploy after editing `worker/worker.js`, run `npx wrangler deploy`
again from the same folder.

---

## If the workers.dev URL differs

The app stores the relay URL on the device (Settings → **Data relay**), not
in code. If your deploy lands on a different hostname, just paste that into
the Data relay field and tap **Test relay** → **Save**. "Reset all to
defaults" does not clear it.

---

## Quick check

Open this in a browser — you should see raw JSON, not an error:

```
https://dsr-yahoo.100dsr100.workers.dev/?url=https://query1.finance.yahoo.com/v8/finance/chart/NDQ.AX?interval=1m%26range=1d
```

---

## worker/worker.js (for reference)

`?url=` passthrough, locked to `yahoo.com` hosts, adds
`Access-Control-Allow-Origin: *`, 20-second edge cache. Full source is in
`worker/worker.js`.
