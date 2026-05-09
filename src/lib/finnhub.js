/**
 * DEPRECATED — do not call Finnhub directly from the frontend.
 *
 * All market data must flow through the serverless route:
 *   GET /api/market/quote?symbol=AAPL
 *
 * Use the `useMarketQuote` hook instead:
 *   import { useMarketQuote } from '@/hooks/useMarketQuote';
 */

export function getQuote() {
  throw new Error(
    '[finnhub] Direct frontend calls are disabled. Use /api/market/quote via useMarketQuote hook.',
  );
}

export function getCandles() {
  throw new Error(
    '[finnhub] Direct frontend calls are disabled. Use /api/market/quote via useMarketQuote hook.',
  );
}
