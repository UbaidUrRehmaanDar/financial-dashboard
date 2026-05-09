/**
 * useMarketQuote(symbol)
 *
 * Fetches market data exclusively from /api/market/quote — never directly
 * from finnhub.io or any external API.
 *
 * Returns: { data, loading, error, refetch }
 * data shape: { symbol, price, change, volume, marketCap, timestamp }
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useMarketQuote(symbol) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [trigger, setTrigger] = useState(0);

  const abortRef    = useRef(null);
  const debounceRef = useRef(null);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    const sym = (symbol ?? '').trim().toUpperCase();

    clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!sym || !/^[A-Z]{1,5}$/.test(sym)) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/market/quote?symbol=${encodeURIComponent(sym)}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const json = await res.json();

        // Normalise — ensure all required fields exist
        setData({
          symbol:    json.symbol    ?? sym,
          price:     json.price     ?? 0,
          change:    json.change    ?? 0,
          volume:    json.volume    ?? 0,
          marketCap: json.marketCap ?? 0,
          timestamp: json.timestamp ?? Date.now(),
        });
        setError(null);

      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message ?? 'Failed to fetch quote');
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [symbol, trigger]);

  return { data, loading, error, refetch };
}

export default useMarketQuote;
