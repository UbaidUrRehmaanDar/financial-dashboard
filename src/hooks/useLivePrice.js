/**
 * useLivePrice(symbols)
 *
 * Connects to Finnhub WebSocket for real-time price streaming.
 * Subscribes to all symbols in the array.
 * Returns { prices: { AAPL: 189.30, ... }, connected, error }
 *
 * Falls back gracefully if WebSocket is unavailable.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const FINNHUB_WS = 'wss://ws.finnhub.io';

export function useLivePrice(symbols = []) {
  const [prices,    setPrices]    = useState({});
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState(null);
  const wsRef       = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef  = useRef(true);

  const connect = useCallback(() => {
    const token = import.meta.env.VITE_FINNHUB_KEY;
    if (!token || !symbols.length) return;

    try {
      const ws = new WebSocket(`${FINNHUB_WS}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        setError(null);
        // Subscribe to all symbols
        symbols.forEach((sym) => {
          ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
        });
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'trade' && Array.isArray(msg.data)) {
            setPrices((prev) => {
              const next = { ...prev };
              msg.data.forEach((trade) => {
                // Use latest trade price
                if (!next[trade.s] || trade.t > (next[`${trade.s}_t`] ?? 0)) {
                  next[trade.s]          = trade.p;
                  next[`${trade.s}_t`]   = trade.t;
                }
              });
              return next;
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setError('WebSocket connection error');
        setConnected(false);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        // Reconnect after 5s
        reconnectRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 5000);
      };

    } catch (err) {
      setError(err.message);
    }
  }, [symbols.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        // Unsubscribe before closing
        symbols.forEach((sym) => {
          try {
            wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol: sym }));
          } catch { /* ignore */ }
        });
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { prices, connected, error };
}

export default useLivePrice;
