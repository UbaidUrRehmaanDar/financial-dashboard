// api/watchlist.js
// Vercel Serverless Function — GET / POST / DELETE /api/watchlist
// Auth: Supabase Bearer token on every request.
// Pure Node.js 18+ ES modules. No next/server, no Edge runtime.

import { createClient } from '@supabase/supabase-js';

const SYMBOL_RE    = /^[A-Z]{1,5}$/;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// ─── CORS ─────────────────────────────────────────────────────────────────────

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// ─── Auth — returns { supabase, userId } or sends 401 ────────────────────────

async function authenticate(req, res) {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — missing token' });
    return null;
  }

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

// ─── GET — list watchlist items + inject live prices ─────────────────────────

async function handleGet(req, res, supabase, userId) {
  const { data: items, error: dbErr } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (dbErr) {
    console.error('[watchlist GET]', dbErr);
    return res.status(500).json({ error: 'Failed to fetch watchlist' });
  }

  if (!items.length) {
    return res.status(200).json({ watchlist: [], count: 0 });
  }

  // Batch-fetch live prices — one request per unique symbol
  const key     = process.env.FINNHUB_KEY;
  const symbols = [...new Set(items.map((i) => i.symbol))];

  const priceResults = await Promise.allSettled(
    symbols.map((sym) =>
      fetch(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${key}`).then((r) => r.json()),
    ),
  );

  const priceMap = Object.fromEntries(
    symbols.map((sym, i) => [
      sym,
      priceResults[i].status === 'fulfilled' ? priceResults[i].value : {},
    ]),
  );

  // Merge live quote data into each watchlist item
  const enriched = items.map((item) => {
    const quote = priceMap[item.symbol] ?? {};
    return {
      ...item,
      current_price:  quote.c  ?? null,
      change:         quote.d  ?? null,
      change_percent: quote.dp ?? null,
      volume:         quote.v  ?? null,
      last_updated:   quote.t  ? new Date(quote.t * 1000).toISOString() : null,
    };
  });

  return res.status(200).json({ watchlist: enriched, count: enriched.length });
}

// ─── POST — add symbol, prevent duplicates ────────────────────────────────────

async function handlePost(req, res, supabase, userId) {
  const body         = req.body ?? {};
  const symbol       = String(body.symbol       ?? '').trim().toUpperCase();
  const company_name = String(body.company_name ?? symbol).trim();

  if (!SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol. Must be 1–5 uppercase letters.' });
  }

  // Duplicate check — scoped to this user
  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({
      error: 'Symbol already in watchlist',
      id:    existing.id,
    });
  }

  // Insert
  const { data: inserted, error: dbErr } = await supabase
    .from('watchlist')
    .insert({
      user_id:      userId,
      symbol,
      company_name: company_name || symbol,
      added_at:     new Date().toISOString(),
    })
    .select()
    .single();

  if (dbErr) {
    console.error('[watchlist POST]', dbErr);
    // RLS violation
    if (dbErr.code === '42501') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    return res.status(500).json({ error: 'Failed to add to watchlist: ' + dbErr.message });
  }

  return res.status(201).json({ data: inserted });
}

// ─── DELETE — remove by id or symbol ─────────────────────────────────────────

async function handleDelete(req, res, supabase, userId) {
  const id     = req.query?.id     ?? req.body?.id;
  const symbol = req.query?.symbol ?? req.body?.symbol;

  if (!id && !symbol) {
    return res.status(400).json({ error: 'id or symbol required' });
  }

  let query = supabase.from('watchlist').delete().eq('user_id', userId);

  if (id) {
    query = query.eq('id', id);
  } else {
    query = query.eq('symbol', String(symbol).trim().toUpperCase());
  }

  // Use count to detect not-found
  const { data, error: dbErr } = await query.select();

  if (dbErr) {
    console.error('[watchlist DELETE]', dbErr);
    return res.status(500).json({ error: 'Failed to delete: ' + dbErr.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(200).json({ success: true, deleted_count: data.length });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { supabase, userId } = auth;

    switch (req.method) {
      case 'GET':    return await handleGet(req, res, supabase, userId);
      case 'POST':   return await handlePost(req, res, supabase, userId);
      case 'DELETE': return await handleDelete(req, res, supabase, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[watchlist]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
