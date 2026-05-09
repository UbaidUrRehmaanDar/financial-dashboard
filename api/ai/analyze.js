// api/ai/analyze.js
// POST /api/ai/analyze
// AI-powered stock analysis using OpenAI GPT.
// Accepts { symbol, price, change, changePercent, volume, marketCap }
// Returns { analysis: string } — technical + fundamental commentary.

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { symbol, price, change, changePercent, volume, marketCap, name } = req.body ?? {};

    if (!symbol) return res.status(400).json({ error: 'symbol is required' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Graceful fallback — return mock analysis if no API key configured
      return res.status(200).json({
        analysis: generateMockAnalysis(symbol, price, changePercent),
        source: 'mock',
      });
    }

    const prompt = buildPrompt({ symbol, name, price, change, changePercent, volume, marketCap });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        max_tokens:  350,
        temperature: 0.7,
        messages: [
          {
            role:    'system',
            content: 'You are a concise financial analyst. Provide brief technical and fundamental commentary on stocks. Be factual, balanced, and mention key metrics. Keep responses under 300 words.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[ai/analyze] OpenAI error:', err);
      // Fallback to mock on API error
      return res.status(200).json({
        analysis: generateMockAnalysis(symbol, price, changePercent),
        source: 'mock',
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content ?? 'Analysis unavailable.';

    return res.status(200).json({ analysis, source: 'ai' });

  } catch (err) {
    console.error('[ai/analyze]', err.message);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}

function buildPrompt({ symbol, name, price, change, changePercent, volume, marketCap }) {
  const mktCapStr = marketCap > 1e12
    ? `$${(marketCap / 1e12).toFixed(2)}T`
    : marketCap > 1e9
    ? `$${(marketCap / 1e9).toFixed(2)}B`
    : marketCap > 0 ? `$${(marketCap / 1e6).toFixed(0)}M` : 'N/A';

  return `Analyze ${name ?? symbol} (${symbol}):
- Current price: $${price?.toFixed(2) ?? 'N/A'}
- Daily change: ${change >= 0 ? '+' : ''}${change?.toFixed(2) ?? 'N/A'} (${changePercent >= 0 ? '+' : ''}${changePercent?.toFixed(2) ?? 'N/A'}%)
- Volume: ${volume?.toLocaleString() ?? 'N/A'}
- Market cap: ${mktCapStr}

Provide: 1) Brief technical outlook (momentum, trend), 2) Fundamental snapshot, 3) Key risk/opportunity in 2-3 sentences each.`;
}

function generateMockAnalysis(symbol, price, changePct) {
  const trend = changePct >= 0 ? 'bullish' : 'bearish';
  const momentum = Math.abs(changePct) > 2 ? 'strong' : 'moderate';
  return `**Technical Outlook:** ${symbol} is showing ${momentum} ${trend} momentum with a ${changePct >= 0 ? '+' : ''}${changePct?.toFixed(2) ?? '0.00'}% move today. Price action suggests ${changePct >= 0 ? 'buyers are in control' : 'selling pressure is elevated'} in the near term.

**Fundamental Snapshot:** At $${price?.toFixed(2) ?? 'N/A'}, the stock is trading ${changePct >= 0 ? 'above' : 'below'} recent levels. Key metrics including P/E ratio, revenue growth, and margin trends should be monitored for confirmation of the current direction.

**Key Risk/Opportunity:** ${changePct >= 0 ? 'The upside opportunity lies in continued momentum if broader market conditions remain supportive. Watch for resistance levels and volume confirmation.' : 'The primary risk is further downside if selling pressure continues. A stabilization above key support levels would signal a potential reversal opportunity.'}

*Note: This is AI-generated commentary for informational purposes only. Not financial advice.*`;
}
