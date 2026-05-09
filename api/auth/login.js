// api/auth/login.js
// POST /api/auth/login — thin wrapper around Supabase Auth signInWithPassword.
// Supabase handles JWT issuance and refresh token rotation natively.
//
// Security note: Generic error messages prevent user enumeration.
// In production, add rate limiting to prevent brute-force attacks.
//
// Refresh token pattern:
// - access_token: short-lived JWT (1h), sent as Authorization: Bearer <token>
// - refresh_token: long-lived, managed by Supabase client
// - Refresh flow: POST /auth/v1/token?grant_type=refresh_token (Supabase client handles this)

import { createClient } from '@supabase/supabase-js';
import { z }            from 'zod';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        error:   'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    console.log('[login] attempt:', email);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Generic message — prevents user enumeration attacks
      console.error('[login] failed for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { user, session } = data;

    return res.status(200).json({
      user: {
        id:           user.id,
        email:        user.email,
        display_name: user.user_metadata?.display_name ?? null,
      },
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
      token_type:    'Bearer',
      expires_in:    session.expires_in,
    });

  } catch (err) {
    console.error('[login] unexpected:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
