/**
 * Vercel Serverless Function — GET /api/market/history
 * Returns historical OHLCV data formatted for Recharts.
 *
 * Query params:
 *   symbol  — 1-5 uppercase letters (e.g. AAPL)
 *   range   — one of: 1D | 1W | 1M | 3M | 1Y
 *
 * Auth: Handled by Supabase with short-lived access tokens +
 *       long-lived refresh tokens (no custom JWT middleware needed).
 *
 * Pure Node.js 18+ Vercel Serverless — no next/server, no Edge runtime.
 */

// ─── In-memory cache ──────────────────────────────────────────────────────────

/** @type {Map<string, { data: object, expires: number }>} */
const cache = new Map();
const CACHE_TTL = 600_000; // 10 minutes

// ─── Per-IP rate limiter ──────────────────────────────────────────────────────

/** @type {Map<string, { count: number, resetAt: number }>} */
const ipLimits = new Map();
const MAX_REQ_PER_MIN = 20;

/**
 * Returns true if the IP has exceeded the rate limit.
 * @param {string} ip
 * @returns {boolean}
 */
function isRateLimited(ip) {
  const now    = Date.now();
  const entry  = ipLimits.get(ip) ?? { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  ipLimits.set(ip, entry);
  return entry.count > MAX_REQ_PER_MIN;
}

// ─── Range → Finnhub resolution + window ─────────────────────────────────────

const RANGE_MAP = {
  '1D': { resolution: '5',  seconds: 60 * 60 * 24        },
  '1W': { resolution: '60', seconds: 60 * 60 * 24 * 7    },
  '1M': { resolution: 'D',  seconds: 60 * 60 * 24 * 30   },
  '3M': { resolution: 'W',  seconds: 60 * 60 * 24 * 90   },
  '1Y': { resolution: 'M',  seconds: 60 * 60 * 24 * 365  },
};

const VALID_RANGES  = Object.keys(RANGE_MAP);
const SYMBOL_RE     = /^[A-Z]{1,5}$/;

// ─── CORS helper ──────────────────────────────────────────────────────────────

/**
 * Set standard CORS + JSON headers.
 * @param {import('@vercel/node').VercelResponse} res
 */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  // ── Param validation ────────────────────────────────────────────────────
  const symbol = String(req.query?.symbol ?? '').trim().toUpperCase();
  const range  = String(req.query?.range  ?? '').trim().toUpperCase();

  if (!SYMBOL_RE.test(symbol) || !VALID_RANGES.includes(range)) {
    return res.status(400).json({ error: 'Valid symbol and range required' });
  }

  // ── Rate limiting ───────────────────────────────────────────────────────
  const ip = req.headers['x-vercel-forwarded-for']
          ?? req.headers['x-forwarded-for']
          ?? req.socket?.remoteAddress
          ?? 'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // ── Cache hit ───────────────────────────────────────────────────────────
  const cacheKey = `${symbol}_${range}`;
  const cached   = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached.data);
  }

  // ── Fetch from Finnhub ──────────────────────────────────────────────────
  try {
    const key = process.env.FINNHUB_KEY;
    if (!key) throw new Error('FINNHUB_KEY environment variable is not set');

    const { resolution, seconds } = RANGE_MAP[range];
    const now  = Math.floor(Date.now() / 1000);
    const from = now - seconds;

    // Fetch candles + profile in parallel
    const [candleRes, profileRes] = await Promise.all([
      fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${key}`
      ),
      fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`
      ),
    ]);

    if (!candleRes.ok)  throw new Error(`Finnhub candle error: ${candleRes.status}`);
    if (!profileRes.ok) throw new Error(`Finnhub profile error: ${profileRes.status}`);

    const [candle, profile] = await Promise.all([candleRes.json(), profileRes.json()]);

    // Graceful no-data handling
    if (candle.s === 'no_data' || !candle.t?.length) {
      const empty = {
        symbol,
        range,
        data: [],
        meta: {
          currency:    profile.currency    ?? 'USD',
          exchange:    profile.exchange    ?? null,
          lastUpdated: Date.now(),
        },
      };
      cache.set(cacheKey, { data: empty, expires: Date.now() + CACHE_TTL });
      res.setHeader('X-Cache', 'MISS');
      return res.status(200).json(empty);
    }

    // Transform Finnhub arrays → Recharts-ready objects
    const { o, h, l, c, v, t } = candle;
    const ohlcv = t.map((ts, i) => ({
      date:   new Date(ts * 1000).toISOString(),
      open:   o[i],
      high:   h[i],
      low:    l[i],
      close:  c[i],
      volume: v[i],
    }));

    const payload = {
      symbol,
      range,
      data: ohlcv,
      meta: {
        currency:    profile.currency    ?? 'USD',
        exchange:    profile.exchange    ?? null,
        lastUpdated: Date.now(),
      },
    };

    cache.set(cacheKey, { data: payload, expires: Date.now() + CACHE_TTL });
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(payload);

  } catch (err) {
    console.error('[history]', err.message);
    return res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}
