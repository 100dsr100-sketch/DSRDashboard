// DSR Dashboard data relay - proxies Yahoo Finance's chart API (which blocks
// browser CORS) so the hosted PWA can fetch quotes/history. Locked to
// yahoo.com hosts. Separate worker from dsrlivechat-translit; touching this
// cannot affect the LiveChat translator.
export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const target = new URL(request.url).searchParams.get('url');
    if (!target || !/^https:\/\/[a-z0-9.-]*yahoo\.com\//i.test(target)) {
      return new Response('bad or missing ?url= (yahoo.com only)', { status: 400, headers: cors });
    }

    let upstream;
    try {
      upstream = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DSRDashboard/1',
          'Accept': 'application/json,text/plain,*/*',
        },
        cf: { cacheTtl: 20, cacheEverything: true },
      });
    } catch (e) {
      return new Response('upstream fetch failed: ' + e, { status: 502, headers: cors });
    }

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=20',
      },
    });
  },
};
