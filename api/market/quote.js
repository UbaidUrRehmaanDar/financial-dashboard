// Vercel Serverless Function — Node.js 18+
// GET /api/market/quote?symbol=AAPL
// No Next.js / Edge runtime dependencies.

const cache     = new Map();   // { symbol -> { data, expires } }
const CACHE_TTL = 60_000;      // 60 s
const SYMBOL_RE = /^[A-Z]{1,5}$/;

// Simple per-minute rate limiter
let reqCount  = 0;
let resetAt   = Date.now() + 60_000;

function checkRate() {
  const now = Date.now();
  if (now > resetAt) { reqCount = 0; resetAt = now + 60_000; }
  return ++reqCount > 30;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  // Validate symbol
  const symbol = String(req.query?.symbol ?? '').trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol. Must be 1–5 uppercase letters.' });
  }

  // Rate limit
  if (checkRate()) {
    return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
  }

  // Cache hit
  const hit = cache.get(symbol);
  if (hit && Date.now() < hit.expires) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(hit.data);
  }

  // Fetch from Finnhub
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

    const data = {
      symbol,
      name:          p.name                   ?? symbol,
      price:         q.c,
      change:        q.d,
      changePercent: q.dp,
      high:          q.h,
      low:           q.l,
      open:          q.o,
      prevClose:     q.pc,
      marketCap:     p.marketCapitalization   ?? null,
      currency:      p.currency               ?? 'USD',
      exchange:      p.exchange               ?? null,
      industry:      p.finnhubIndustry        ?? null,
      logo:          p.logo                   ?? null,
      timestamp:     Date.now(),
    };

    cache.set(symbol, { data, expires: Date.now() + CACHE_TTL });
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[quote]', err.message);
    return res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
