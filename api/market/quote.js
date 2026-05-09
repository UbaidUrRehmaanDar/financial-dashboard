import { readSymbol, sendError, setCors, toNumber, withMeta } from './_shared.js';

const cache = new Map();
const CACHE_TTL_MS = 60_000;
const CACHE_TTL_SECONDS = 60;

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  const symbolResult = readSymbol(req);
  if (symbolResult.error) return sendError(res, 400, symbolResult.error);
  const symbol = symbolResult.value;

  console.log('[api/market/quote]', { symbol, query: req.query });

  const hit = cache.get(symbol);
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

    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`;
    const nowSec = Math.floor(Date.now() / 1000);
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${nowSec - 604800}&to=${nowSec}&token=${token}`;

    const [quoteRes, profileRes, candleRes] = await Promise.all([
      fetch(quoteUrl),
      fetch(profileUrl),
      fetch(candleUrl),
    ]);

    if (!quoteRes.ok) throw new Error(`Quote fetch failed: ${quoteRes.status}`);
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);
    if (!candleRes.ok) throw new Error(`Candle fetch failed: ${candleRes.status}`);

    const [quote, profile, candle] = await Promise.all([quoteRes.json(), profileRes.json(), candleRes.json()]);

    const candleVolume = Array.isArray(candle?.v) && candle.v.length > 0
      ? toNumber(candle.v[candle.v.length - 1], 0)
      : 0;
    const marketCapMillions = toNumber(profile?.marketCapitalization, 0);
    const marketCap = marketCapMillions > 0 ? marketCapMillions * 1_000_000 : 0;

    const payload = withMeta({
      symbol,
      name: profile?.name ?? symbol,
      price: toNumber(quote?.c, 0),
      change: toNumber(quote?.d, 0),
      changePercent: toNumber(quote?.dp, 0),
      volume: candleVolume,
      marketCap,
      timestamp: Date.now(),
    }, {
      cached: false,
      ttlSeconds: CACHE_TTL_SECONDS,
      lastUpdated: Date.now(),
    });

    cache.set(symbol, {
      payload,
      lastUpdated: payload.meta.lastUpdated,
      expiresAtMs: Date.now() + CACHE_TTL_MS,
    });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/market/quote] failed', error);
    return sendError(res, 500, 'Failed to fetch quote data.');
  }
}
