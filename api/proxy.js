// Vercel Serverless Function — proxy mọi request đến GAS
// File: api/proxy.js

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyD-ZJmynUk-H6jE0V70jzao-i_xBRimtfzLuoeHi1W/exec';

export default async function handler(req, res) {
  // CORS — cho phép browser gọi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let gasRes;

    if (req.method === 'POST') {
      // askAI
      gasRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        redirect: 'follow'
      });
    } else {
      // getData, getChiTieu, getTabData...
      const params = new URLSearchParams(req.query).toString();
      const url = params ? `${GAS_URL}?${params}` : GAS_URL;
      gasRes = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Vercel Proxy)',
          'Accept': 'application/json, text/html, */*'
        },
        redirect: 'follow'
      });
    }

    const contentType = gasRes.headers.get('content-type') || '';
    const body = await gasRes.text();

    // Nếu GAS trả HTML (serve index.html) → pass through
    if (contentType.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(body);
      return;
    }

    // JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(body);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
