// DSR Dashboard private data store - holds the three hand-maintained balances
// (house price, superannuation, margin loan) that the desktop Dashboard app
// pushes and the phone PWA pulls. KV-backed so it survives between requests.
//
// Access is gated by a single shared secret that lives ONLY in the URL path
// (/d/<SECRET>) - never in the public DSRDashboard repo. The desktop app has
// it as a const; the phone has it pasted into Settings > "PC sync" and stored
// in localStorage. Rotate with `npx wrangler secret put SYNC_KEY`.
//
// Separate worker from dsr-yahoo and dsrlivechat-translit - touching this
// cannot affect the price relay or the LiveChat translator.
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const m = new URL(request.url).pathname.match(/^\/d\/(.+)$/);
    const key = m && decodeURIComponent(m[1]);
    if (!env.SYNC_KEY || !key || key !== env.SYNC_KEY) {
      return new Response('forbidden', { status: 403, headers: cors });
    }

    if (request.method === 'POST') {
      let obj;
      try {
        obj = await request.json();
      } catch (e) {
        return new Response('bad json', { status: 400, headers: cors });
      }
      obj.receivedAt = Date.now();
      await env.KV.put('balances', JSON.stringify(obj));
      return new Response('ok', { status: 200, headers: cors });
    }

    // GET - hand back whatever the desktop last pushed (or {} if never)
    const data = await env.KV.get('balances');
    return new Response(data || '{}', {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  },
};
