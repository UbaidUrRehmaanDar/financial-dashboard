import { RANGE_CONFIG, readRange, readSymbol, sendError, setCors, toNumber, withMeta } from './_shared.js';

const cache = new Map();
const CACHE_TTL_MS = 600_000;
const CACHE_TTL_SECONDS = 600;

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  const symbolResult = readSymbol(req);
  if (symbolResult.error) return sendError(res, 400, symbolResult.error);
  const symbol = symbolResult.value;
  const rangeResult = readRange(req);
  if (rangeResult.error) return sendError(res, 400, rangeResult.error);
  const range = rangeResult.value;

  console.log('[api/market/history]', { symbol, range, query: req.query });

  const cacheKey = `${symbol}_${range}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() < hit.expiresAtMs) {
    return res.status(200).json(withMeta(hit.payload, {
      cached: true,
      ttlSeconds: CACHE_TTL_SECONDS,
      lastUpdated: hit.lastUpdated,
    }));
  }

  try {
    const token = process.env.FINNHUB_KEY;
    if (!token) {
      return sendError(res, 500, 'Server misconfigured: FINNHUB_KEY missing.');
    }

    const now = Math.floor(Date.now() / 1000);
    const { resolution, seconds } = RANGE_CONFIG[range];
    const from = now - seconds;

    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${token}`;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`;

    const [candleRes, profileRes] = await Promise.all([fetch(candleUrl), fetch(profileUrl)]);
    if (!candleRes.ok) throw new Error(`Candle fetch failed: ${candleRes.status}`);
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);

    const [candles, profile] = await Promise.all([
      candleRes.json(),
      profileRes.json(),
    ]);

    const hasNoData = candles?.s === 'no_data' || !Array.isArray(candles?.t);
    const data = hasNoData
      ? []
      : candles.t
          .map((ts, i) => ({
            date: new Date(ts * 1000).toISOString(),
            open: toNumber(candles?.o?.[i], 0),
            high: toNumber(candles?.h?.[i], 0),
            low: toNumber(candles?.l?.[i], 0),
            close: toNumber(candles?.c?.[i], 0),
            volume: toNumber(candles?.v?.[i], 0),
          }))
          .filter((row) =>
            Number.isFinite(Date.parse(row.date))
            && Number.isFinite(row.open)
            && Number.isFinite(row.high)
            && Number.isFinite(row.low)
            && Number.isFinite(row.close)
            && Number.isFinite(row.volume)
          );

    const payload = withMeta({
      symbol,
      range,
      data,
      meta: {
        currency: profile?.currency ?? 'USD',
        exchange: profile?.exchange ?? null,
      },
    }, {
      cached: false,
      ttlSeconds: CACHE_TTL_SECONDS,
      lastUpdated: Date.now(),
    });

    cache.set(cacheKey, {
      payload,
      lastUpdated: payload.meta.lastUpdated,
      expiresAtMs: Date.now() + CACHE_TTL_MS,
    });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/market/history] failed', error);
    return sendError(res, 500, 'Failed to fetch historical data.');
  }
}
