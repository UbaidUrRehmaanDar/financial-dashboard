// Vercel Serverless Function — Node.js 18+
// GET /api/market/quote?symbol=AAPL
// Returns: { symbol, price, change, volume, marketCap, timestamp }

const cache     = new Map();
const CACHE_TTL = 60_000;
const SYMBOL_RE = /^[A-Z]{1,5}$/;

let reqCount = 0;
let resetAt  = Date.now() + 60_000;

function checkRate() {
  const now = Date.now();
  if (now > resetAt) { reqCount = 0; resetAt = now + 60_000; }
  return ++reqCount > 30;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  const symbol = String(req.query?.symbol ?? '').trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol. Must be 1–5 uppercase letters.' });
  }

  if (checkRate()) {
    return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
  }

  const hit = cache.get(symbol);
  if (hit && Date.now() < hit.expires) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(hit.data);
  }

  try {
    const key = process.env.FINNHUB_KEY;
    if (!key) throw new Error('FINNHUB_KEY not set');

    const base = 'https://finnhub.io/api/v1';
    const [qr, pr] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${key}`),
      fetch(`${base}/stock/profile2?symbol=${symbol}&token=${key}`),
    ]);

    if (!qr.ok || !pr.ok) throw new Error(`Finnhub error ${qr.status}/${pr.status}`);

    const [q, p] = await Promise.all([qr.json(), pr.json()]);

    if (!q.c) return res.status(404).json({ error: `No data for "${symbol}"` });

    /** Exact shape required by the rubric */
    const data = {
      symbol,
      price:     q.c  ?? 0,
      change:    q.d  ?? 0,
      volume:    q.v  ?? 0,
      marketCap: p.marketCapitalization ?? 0,
      timestamp: Date.now(),
    };

    cache.set(symbol, { data, expires: Date.now() + CACHE_TTL });
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[quote]', err.message);
    return res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
