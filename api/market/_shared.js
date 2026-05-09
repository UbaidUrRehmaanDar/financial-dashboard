export const SYMBOL_RE = /^[A-Z]{1,5}$/;
export const VALID_RANGES = new Set(['1D', '1W', '1M', '3M', '1Y']);

export const RANGE_CONFIG = {
  '1D': { resolution: '5', seconds: 86_400 },
  '1W': { resolution: '60', seconds: 604_800 },
  '1M': { resolution: 'D', seconds: 2_592_000 },
  '3M': { resolution: 'W', seconds: 7_776_000 },
  '1Y': { resolution: 'M', seconds: 31_536_000 },
};

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function readSymbol(req) {
  const symbol = req.query.symbol?.toString().trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol || '')) {
    return { error: 'Invalid symbol. Use 1-5 uppercase letters.' };
  }
  return { value: symbol };
}

export function readRange(req) {
  const range = req.query.range?.toString().trim().toUpperCase();
  if (!VALID_RANGES.has(range || '')) {
    return { error: 'Invalid range. Allowed: 1D, 1W, 1M, 3M, 1Y.' };
  }
  return { value: range };
}

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function sendError(res, status, error, details = null) {
  return res.status(status).json({
    error,
    ...(details ? { details } : {}),
  });
}

export function withMeta(payload, { cached, ttlSeconds, lastUpdated }) {
  return {
    ...payload,
    meta: {
      ...(payload.meta || {}),
      cached,
      ttl: ttlSeconds,
      lastUpdated,
    },
  };
}
