import { sendError, setCors, toNumber, withMeta } from './_shared.js';

const cache = new Map();
const CACHE_KEY = 'overview';
const CACHE_TTL_MS = 300_000;
const CACHE_TTL_SECONDS = 300;

const INDICES = [
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
  { symbol: 'DIA', name: 'Dow Jones ETF' },
];

const TOP_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'NFLX', 'INTC',
];

async function fetchQuote(symbol, token) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quote fetch failed for ${symbol}: ${res.status}`);
  const q = await res.json();
  return {
    symbol,
    price: toNumber(q?.c, 0),
    change: toNumber(q?.d, 0),
    changePercent: toNumber(q?.dp, 0),
  };
}

export default async function handler(req, res) {
  setCors(res);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  const hit = cache.get(CACHE_KEY);
  if (hit && Date.now() < hit.expiresAtMs) {
    return res.status(200).json(withMeta(hit.payload, {
      cached: true,
      ttlSeconds: CACHE_TTL_SECONDS,
      lastUpdated: hit.lastUpdated,
    }));
  }

  try {
    const token = process.env.FINNHUB_KEY || process.env.FINNHUB_API_KEY;
    if (!token) {
      return sendError(res, 500, 'Server misconfigured: FINNHUB_KEY missing.', {
        expected: ['FINNHUB_KEY', 'FINNHUB_API_KEY'],
      });
    }

    const [indicesRaw, symbolsRaw] = await Promise.all([
      Promise.all(INDICES.map((item) => fetchQuote(item.symbol, token))),
      Promise.all(TOP_SYMBOLS.map((symbol) => fetchQuote(symbol, token))),
    ]);

    const indices = indicesRaw.map((item) => ({
      symbol: item.symbol,
      price: item.price,
      change: item.change,
    }));

    const ranked = symbolsRaw
      .filter((item) => item.price > 0)
      .sort((a, b) => b.changePercent - a.changePercent);

    const topGainers = ranked.slice(0, 5).map((item) => ({
      symbol: item.symbol,
      price: item.price,
      change: item.change,
    }));

    const topLosers = [...ranked]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)
      .map((item) => ({
        symbol: item.symbol,
        price: item.price,
        change: item.change,
      }));

    const payload = withMeta({
      indices,
      topGainers,
      topLosers,
    }, {
      cached: false,
      ttlSeconds: CACHE_TTL_SECONDS,
      lastUpdated: Date.now(),
    });

    cache.set(CACHE_KEY, {
      payload,
      lastUpdated: payload.meta.lastUpdated,
      expiresAtMs: Date.now() + CACHE_TTL_MS,
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/market/overview] failed', error);
    return sendError(res, 500, 'Failed to fetch market overview.');
  }
}
