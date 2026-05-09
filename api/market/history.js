const cache = new Map();
const CACHE_TTL = 600_000;
const SYMBOL_RE = /^[A-Z]{1,5}$/;
const VALID_RANGES = new Set(['1D', '1W', '1M', '3M', '1Y']);

const RANGE_CONFIG = {
  '1D': { resolution: '5', seconds: 86_400 },
  '1W': { resolution: '60', seconds: 604_800 },
  '1M': { resolution: 'D', seconds: 2_592_000 },
  '3M': { resolution: 'W', seconds: 7_776_000 },
  '1Y': { resolution: 'M', seconds: 31_536_000 },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const symbol = req.query.symbol?.toString().toUpperCase();
  const range = req.query.range?.toString().toUpperCase();

  if (!SYMBOL_RE.test(symbol || '')) {
    return res.status(400).json({ error: 'Invalid symbol. Use 1-5 uppercase letters.' });
  }

  if (!VALID_RANGES.has(range || '')) {
    return res.status(400).json({ error: 'Invalid range. Use one of: 1D, 1W, 1M, 3M, 1Y.' });
  }

  console.log('[api/market/history]', { symbol, range, query: req.query });

  const cacheKey = `${symbol}_${range}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() < hit.expiresAt) {
    return res.status(200).json(hit.data);
  }

  try {
    const token = process.env.FINNHUB_KEY;
    if (!token) {
      return res.status(500).json({ error: 'Server misconfigured: FINNHUB_KEY missing.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const { resolution, seconds } = RANGE_CONFIG[range];
    const from = now - seconds;

    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${token}`;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`;

    const [candleRes, profileRes] = await Promise.all([fetch(candleUrl), fetch(profileUrl)]);
    if (!candleRes.ok) throw new Error(`Candle fetch failed: ${candleRes.status}`);
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);

    const [candles, profile] = await Promise.all([candleRes.json(), profileRes.json()]);

    const data = Array.isArray(candles?.t)
      ? candles.t.map((ts, i) => ({
          date: new Date(ts * 1000).toISOString(),
          open: candles.o?.[i] ?? null,
          high: candles.h?.[i] ?? null,
          low: candles.l?.[i] ?? null,
          close: candles.c?.[i] ?? null,
          volume: candles.v?.[i] ?? null,
        }))
      : [];

    const payload = {
      symbol,
      range,
      data,
      meta: {
        currency: profile?.currency ?? 'USD',
        exchange: profile?.exchange ?? null,
        lastUpdated: Date.now(),
      },
    };

    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/market/history] failed', error);
    return res.status(500).json({ error: 'Failed to fetch historical data.' });
  }
}
