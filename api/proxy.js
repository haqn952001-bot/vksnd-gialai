const GAS_URL = 'https://script.google.com/macros/s/AKfycbzQCwbN7cKDse3Zlxs6zOIHPaFdSwBeed2hMFAzkCfRsj13obL5i-YRCdWnNJDP4bjsLg/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Referer': 'https://script.google.com/',
    };

    let gasRes;
    if (req.method === 'POST') {
      gasRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        redirect: 'follow',
      });
    } else {
      const params = new URLSearchParams();
      Object.entries(req.query || {}).forEach(([k,v]) => params.set(k, v));
      const url = params.toString() ? `${GAS_URL}?${params}` : GAS_URL;
      gasRes = await fetch(url, { method: 'GET', headers, redirect: 'follow' });
    }

    const ct = gasRes.headers.get('content-type') || '';
    const body = await gasRes.text();

    // Log để debug
    console.log(`[proxy] action=${req.query?.action} status=${gasRes.status} ct=${ct.slice(0,30)} body=${body.slice(0,100)}`);

    if (ct.includes('text/html') || body.trim().startsWith('<')) {
      // GAS trả HTML — thường do redirect/auth issue
      // Trả error JSON thay vì HTML để frontend xử lý
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ error: 'GAS_HTML_RESPONSE', status: gasRes.status, hint: 'Check GAS deployment is public' });
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(body);

  } catch (err) {
    console.error('[proxy] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
