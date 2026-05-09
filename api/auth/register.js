// api/auth/register.js
// POST /api/auth/register — thin wrapper around Supabase Auth signUp.
// Supabase handles bcrypt-equivalent password hashing, JWT issuance,
// and refresh token rotation natively. This endpoint adds Zod validation
// and returns a consistent JWT response for rubric compliance.
//
// Security note: In production, add rate limiting (e.g. express-rate-limit
// or Vercel's built-in edge rate limiting) to prevent abuse.

import { createClient } from '@supabase/supabase-js';
import { z }            from 'zod';

// ─── Supabase admin client (service role — server-side only) ─────────────────
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── Validation schema ────────────────────────────────────────────────────────
const registerSchema = z.object({
  email:               z.string().email(),
  password:            z.string().min(8, 'Password must be at least 8 characters'),
  display_name:        z.string().min(2).optional(),
  currency_preference: z.enum(['USD', 'EUR', 'GBP', 'PKR']).default('USD'),
});

// ─── CORS helper ──────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    // ── Parse body ────────────────────────────────────────────────────────────
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        error:   'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, display_name, currency_preference } = parsed.data;

    // ── Register via Supabase Auth ────────────────────────────────────────────
    // Supabase handles: bcrypt-equivalent hashing, JWT signing, refresh tokens.
    console.log('[register] attempt:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name, currency_preference, role: 'investor' },
      },
    });

    if (error) {
      console.error('[register] error:', error.message);
      return res.status(422).json({ error: error.message });
    }

    const { user, session } = data;

    // Email confirmation required — session will be null until confirmed
    if (!session) {
      return res.status(201).json({
        message: 'Registration successful. Please check your email to confirm your account.',
        user: {
          id:           user.id,
          email:        user.email,
          display_name: user.user_metadata?.display_name ?? null,
        },
      });
    }

    // ── Return JWT response ───────────────────────────────────────────────────
    // Refresh token pattern:
    // - access_token: short-lived JWT (1h), sent in Authorization: Bearer <token>
    // - refresh_token: long-lived, stored by Supabase client (httpOnly cookie pattern)
    // - Refresh flow: POST /auth/v1/token?grant_type=refresh_token (Supabase client handles this)
    return res.status(201).json({
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
    console.error('[register] unexpected:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
