// api/portfolio.js
// Vercel Serverless Function — GET / POST / DELETE /api/portfolio
// Auth: Supabase Bearer token verification on every request.
// Pure Node.js 18+ ES modules. No next/server, no Edge runtime.

import { createClient } from '@supabase/supabase-js';

const SYMBOL_RE   = /^[A-Z]{1,5}$/;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// ─── CORS helper ──────────────────────────────────────────────────────────────

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// ─── Auth helper — returns { supabase, userId } or sends 401 ─────────────────

async function authenticate(req, res) {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — missing token' });
    return null;
  }

  // Create a per-request Supabase client that forwards the user's JWT.
  // This lets RLS policies run as the authenticated user.
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: auth } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized — invalid token' });
    return null;
  }

  return { supabase, userId: user.id };
}

// ─── GET — fetch holdings + compute live P&L ─────────────────────────────────

async function handleGet(req, res, supabase, userId) {
  // 1. Fetch all holdings for this user
  const { data: holdings, error: dbErr } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', userId)
    .order('buy_date', { ascending: false });

  if (dbErr) {
    console.error('[portfolio GET]', dbErr);
    return res.status(500).json({ error: 'Failed to fetch portfolio' });
  }

  if (!holdings.length) {
    return res.status(200).json({
      holdings: [],
      total_value:        0,
      total_gain_loss:    0,
      total_gain_loss_pct: 0,
    });
  }

  // 2. Batch-fetch live prices — one request per unique symbol (no N+1)
  const key     = process.env.FINNHUB_KEY;
  const symbols = [...new Set(holdings.map((h) => h.symbol))];

  const priceResults = await Promise.allSettled(
    symbols.map((sym) =>
      fetch(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${key}`).then((r) => r.json()),
    ),
  );

  const priceMap = Object.fromEntries(
    symbols.map((sym, i) => [
      sym,
      priceResults[i].status === 'fulfilled' ? priceResults[i].value : null,
    ]),
  );

  // 3. Compute per-holding metrics
  let total_value     = 0;
  let total_gain_loss = 0;
  let total_cost      = 0;

  const computed = holdings.map((h) => {
    const current_price = priceMap[h.symbol]?.c || h.buy_price;
    const current_value = current_price * h.quantity;
    const cost          = h.buy_price   * h.quantity;
    const gain_loss     = (current_price - h.buy_price) * h.quantity;
    const gain_loss_pct = h.buy_price > 0
      ? ((current_price - h.buy_price) / h.buy_price) * 100
      : 0;

    total_value     += current_value;
    total_gain_loss += gain_loss;
    total_cost      += cost;

    return {
      ...h,
      current_price,
      current_value,
      gain_loss,
      gain_loss_pct,
    };
  });

  const total_gain_loss_pct = total_cost > 0
    ? (total_gain_loss / total_cost) * 100
    : 0;

  return res.status(200).json({
    holdings: computed,
    total_value,
    total_gain_loss,
    total_gain_loss_pct,
  });
}

// ─── POST — add a new holding ─────────────────────────────────────────────────

async function handlePost(req, res, supabase, userId) {
  const body = req.body ?? {};
  const symbol       = String(body.symbol       ?? '').trim().toUpperCase();
  const quantity     = Number(body.quantity);
  const buy_price    = Number(body.buy_price);
  const company_name = String(body.company_name ?? symbol).trim();

  // Validate
  if (!SYMBOL_RE.test(symbol) || !(quantity > 0) || !(buy_price > 0)) {
    return res.status(400).json({
      error: 'Invalid input. symbol (1-5 letters), quantity > 0, buy_price > 0 required.',
    });
  }

  const { data, error: dbErr } = await supabase
    .from('portfolio')
    .insert({
      user_id:      userId,
      symbol,
      quantity,
      buy_price,
      company_name,
      buy_date: new Date().toISOString().split('T')[0],
    })
    .select();

  if (dbErr) {
    console.error('[portfolio POST]', dbErr);
    return res.status(500).json({ error: 'Failed to add holding: ' + dbErr.message });
  }

  return res.status(201).json({ data: data[0] });
}

// ─── DELETE — remove a holding ────────────────────────────────────────────────

async function handleDelete(req, res, supabase, userId) {
  // Accept id from query string (?id=123) or JSON body
  const id = req.query?.id ?? req.body?.id;
  if (!id) {
    return res.status(400).json({ error: 'Missing holding id' });
  }

  const { data, error: dbErr } = await supabase
    .from('portfolio')
    .delete()
    .eq('id',      id)
    .eq('user_id', userId)
    .select();

  if (dbErr) {
    console.error('[portfolio DELETE]', dbErr);
    return res.status(500).json({ error: 'Failed to delete holding: ' + dbErr.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Holding not found' });
  }

  return res.status(200).json({ success: true });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Authenticate every non-OPTIONS request
    const auth = await authenticate(req, res);
    if (!auth) return; // 401 already sent

    const { supabase, userId } = auth;

    switch (req.method) {
      case 'GET':    return await handleGet(req, res, supabase, userId);
      case 'POST':   return await handlePost(req, res, supabase, userId);
      case 'DELETE': return await handleDelete(req, res, supabase, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[portfolio]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
