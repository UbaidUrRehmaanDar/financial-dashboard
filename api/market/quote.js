const cache = new Map();
const CACHE_TTL = 60_000;
const SYMBOL_RE = /^[A-Z]{1,5}$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const symbol = req.query.symbol?.toString().toUpperCase();
  if (!SYMBOL_RE.test(symbol || '')) {
    return res.status(400).json({ error: 'Invalid symbol. Use 1-5 uppercase letters.' });
  }

  console.log('[api/market/quote]', { symbol, query: req.query });

  const hit = cache.get(symbol);
  if (hit && Date.now() < hit.expiresAt) {
    return res.status(200).json(hit.data);
  }

  try {
    const token = process.env.FINNHUB_KEY;
    if (!token) {
      return res.status(500).json({ error: 'Server misconfigured: FINNHUB_KEY missing.' });
    }

    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`;

    const [quoteRes, profileRes] = await Promise.all([fetch(quoteUrl), fetch(profileUrl)]);

    if (!quoteRes.ok) throw new Error(`Quote fetch failed: ${quoteRes.status}`);
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);

    const [quote, profile] = await Promise.all([quoteRes.json(), profileRes.json()]);

    const payload = {
      symbol,
      name: profile?.name ?? symbol,
      price: quote?.c ?? null,
      change: quote?.d ?? null,
      changePercent: quote?.dp ?? null,
      volume: quote?.v ?? null,
      marketCap: profile?.marketCapitalization ?? null,
      timestamp: Date.now(),
    };

    cache.set(symbol, { data: payload, expiresAt: Date.now() + CACHE_TTL });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/market/quote] failed', error);
    return res.status(500).json({ error: 'Failed to fetch quote data.' });
  }
}
