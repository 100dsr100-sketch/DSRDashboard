# DSR Dashboard — private balances store (Cloudflare Worker)

The desktop Dashboard app (`C:\Lazarus Projects\Dashboard`) is the source of
truth for three hand-maintained numbers:

- House price (6 Reading St estimate)
- Superannuation
- Margin loan

Every time you **Save** in the desktop app's Portfolio Settings it POSTs those
three to this worker. The phone PWA pulls them on launch (and via Settings →
**PC sync** → *Pull from PC now*) so it never drifts from the PC.

Data lives in Workers KV, gated by one shared secret that sits **only in the
URL path** — never in this public repo. Runs on the same free Cloudflare
account as `dsr-yahoo` (`100dsr100@gmail.com`), as a **separate worker**, so it
can't affect the price relay.

---

## One-time setup

From a terminal where wrangler is logged in for this account
(`npx wrangler login` if not):

```
cd "C:\HTML Apps\DSR Dashboard\worker-data"

REM 1. make the KV namespace, then paste the printed id into wrangler.toml (id = "...")
npx wrangler kv namespace create KV

REM 2. set the shared secret. Generate a long random string, e.g.:
REM    powershell -c "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"
npx wrangler secret put SYNC_KEY

REM 3. publish
npx wrangler deploy
```

Deploys to:

```
https://dsr-dash-data.100dsr100.workers.dev
```

Your full sync URL (base + `/d/` + the SYNC_KEY you chose):

```
https://dsr-dash-data.100dsr100.workers.dev/d/<SYNC_KEY>
```

Put that **same string** in two places:

1. **Desktop app** — `C:\Lazarus Projects\Dashboard\UPhoneSync.pas`, the
   `SYNC_KEY` const (URL base is already there). Rebuild.
2. **Phone** — DSR Dashboard → Settings → **PC sync** field → paste → Save.

---

## Rotating the secret

`npx wrangler secret put SYNC_KEY` again with a new value, then update the two
places above. "Reset all to defaults" on the phone does **not** clear the PC
sync field.

---

## Quick check

```
curl https://dsr-dash-data.100dsr100.workers.dev/d/<SYNC_KEY>
```

Before the first desktop Save it returns `{}`. After a Save it returns the
three values plus `generatedAt` / `receivedAt`. A wrong/missing key returns
`403 forbidden`.
