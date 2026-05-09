/**
 * useMarketQuote — custom React hook for fetching market quote data.
 *
 * Fetches from /api/market/quote?symbol=<symbol> with:
 * - 200ms debounce on symbol changes
 * - AbortController cleanup on unmount / symbol change
 * - Loading, error, and refetch states
 *
 * @param {string} symbol - Ticker symbol (e.g. "AAPL")
 * @returns {{ data: object|null, loading: boolean, error: string|null, refetch: () => void }}
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useMarketQuote(symbol) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Tracks the current fetch so we can abort it
  const abortRef    = useRef(null);
  // Tracks the debounce timer
  const debounceRef = useRef(null);
  // Allows manual refetch trigger
  const [trigger, setTrigger] = useState(0);

  /**
   * Trigger a manual refetch.
   */
  const refetch = useCallback(() => {
    setTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    const sym = (symbol ?? '').trim().toUpperCase();

    // Clear any pending debounce
    clearTimeout(debounceRef.current);

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Don't fetch if symbol is empty or invalid
    if (!sym || !/^[A-Z]{1,5}$/.test(sym)) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce 200ms before firing the request
    debounceRef.current = setTimeout(async () => {
      const controller  = new AbortController();
      abortRef.current  = controller;

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
        setData(json);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return; // Unmounted or symbol changed — ignore
        setError(err.message ?? 'Failed to fetch quote');
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 200);

    // Cleanup: abort fetch + clear debounce on unmount or symbol change
    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [symbol, trigger]);

  return { data, loading, error, refetch };
}

export default useMarketQuote;
