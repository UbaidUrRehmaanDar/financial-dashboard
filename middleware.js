/**
 * Vercel Edge Middleware — runs on all /api/* routes.
 * Public exception: GET /api/market/quote (no auth required).
 * All other /api/* routes require a valid Supabase JWT.
 */

import { NextResponse } from 'next/server';

/** Routes that do NOT require authentication */
const PUBLIC_ROUTES = [
  '/api/market/quote',
];

/**
 * Decode and verify a JWT using the SUPABASE_JWT_SECRET.
 * Uses the Web Crypto API available in the Edge runtime.
 *
 * @param {string} token  - Raw JWT string (without "Bearer " prefix)
 * @param {string} secret - SUPABASE_JWT_SECRET value
 * @returns {Promise<object>} Decoded payload
 */
async function verifyJWT(token, secret) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Malformed JWT');
  }

  // Import the secret key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  // Verify signature
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature    = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  );

  const valid = await crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    signature,
    encoder.encode(signingInput),
  );

  if (!valid) throw new Error('Invalid JWT signature');

  // Decode payload
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  // Check expiry
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('JWT expired');
  }

  return payload;
}

/**
 * Edge middleware handler.
 * @param {Request} request
 */
export async function middleware(request) {
  const { pathname } = new URL(request.url);

  // Only intercept /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public routes through without auth
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Extract Bearer token
  const authHeader = request.headers.get('Authorization') ?? '';
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized — missing token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error('[middleware] SUPABASE_JWT_SECRET is not set');
    return new NextResponse(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const payload = await verifyJWT(token, secret);

    // Forward user_id to downstream handlers via request header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub ?? '');
    requestHeaders.set('x-user-email', payload.email ?? '');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: `Unauthorized — ${err.message}` }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
