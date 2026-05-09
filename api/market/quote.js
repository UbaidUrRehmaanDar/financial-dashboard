/**
 * Vercel Serverless Function — GET /api/market/quote?symbol=AAPL
 * Public endpoint. Fetches quote + profile from Finnhub with in-memory cache + rate limiting.
 */

/** @type {Map<string, { data: object, expires: number }>} */
const cache = new Map();

/** Rate limiter state */
const rateLimit = {
  count: 0,
  resetAt: Date.now() + 60_000,
};

const CACHE_TTL   = 60_000;  // 60 seconds
const MAX_REQ_MIN = 30;
const SYMBOL_RE   = /^[A-Z]{1,5}$/;

/**
 * Set standard CORS + JSON headers.
 * @param {import('@vercel/node').VercelResponse} res
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

/**
 * Check and update rate limiter. Returns true if request should be blocked.
 * @returns {boolean}
 */
function isRateLimited() {
  const now = Date.now();
  if (now > rateLimit.resetAt) {
    rateLimit.count   = 0;
    rateLimit.resetAt = now + 60_000;
  }
  rateLimit.count++;
  return rateLimit.count > MAX_REQ_MIN;
}

/**
 * Main handler.
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Symbol validation ──────────────────────────────────────────────────────
  const symbol = (req.query.symbol ?? '').trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol)) {
    return res.status(400).json({
      error: 'Invalid symbol. Must be 1–5 uppercase letters (e.g. AAPL).',
    });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (isRateLimited()) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // ── Cache check ────────────────────────────────────────────────────────────
  const cached = cache.get(symbol);
  if (cached && Date.now() < cached.expires) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached.data);
  }

  // ── Finnhub fetch ──────────────────────────────────────────────────────────
  try {
    const key = process.env.FINNHUB_KEY;
    if (!key) throw new Error('FINNHUB_KEY environment variable is not set');

    const base = 'https://finnhub.io/api/v1';
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${key}`),
      fetch(`${base}/stock/profile2?symbol=${symbol}&token=${key}`),
    ]);

    if (!quoteRes.ok || !profileRes.ok) {
      throw new Error(`Finnhub responded with ${quoteRes.status} / ${profileRes.status}`);
    }

    const [quote, profile] = await Promise.all([quoteRes.json(), profileRes.json()]);

    // Finnhub returns c=0 when symbol is unknown
    if (!quote.c) {
      return res.status(404).json({ error: `No data found for symbol "${symbol}"` });
    }

    /** @type {object} */
    const data = {
      symbol,
      name:          profile.name          ?? symbol,
      price:         quote.c,
      change:        quote.d,
      changePercent: quote.dp,
      high:          quote.h,
      low:           quote.l,
      open:          quote.o,
      prevClose:     quote.pc,
      volume:        profile.shareOutstanding ?? null,
      marketCap:     profile.marketCapitalization ?? null,
      currency:      profile.currency ?? 'USD',
      exchange:      profile.exchange ?? null,
      industry:      profile.finnhubIndustry ?? null,
      logo:          profile.logo ?? null,
      weburl:        profile.weburl ?? null,
      timestamp:     Date.now(),
    };

    // Store in cache
    cache.set(symbol, { data, expires: Date.now() + CACHE_TTL });
    res.setHeader('X-Cache', 'MISS');

    return res.status(200).json(data);
  } catch (err) {
    console.error('[quote] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
