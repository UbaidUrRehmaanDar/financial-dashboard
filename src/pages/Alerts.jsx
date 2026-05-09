import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, X, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/util';
import { supabase } from '@/lib/supabase';

const fmt = (n) => n?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

// ─── In-app toast notification ────────────────────────────────────────────────

function AlertToast({ alerts }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="bg-card border border-border rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 pointer-events-auto max-w-xs"
          >
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              a.direction === 'above' ? 'bg-emerald-500/15' : 'bg-rose-500/15')}>
              {a.direction === 'above'
                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                : <TrendingDown className="w-4 h-4 text-rose-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold">{a.symbol} Alert Triggered!</p>
              <p className="text-xs text-muted-foreground">
                Price {a.direction === 'above' ? 'rose above' : 'fell below'} ${fmt(a.targetPrice)}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Alerts() {
  const [alerts,      setAlerts]      = useState([]);
  const [triggered,   setTriggered]   = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [symbol,      setSymbol]      = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction,   setDirection]   = useState('above'); // 'above' | 'below'
  const [formErr,     setFormErr]     = useState('');
  const [livePrices,  setLivePrices]  = useState({});
  const toastTimer = useRef(null);

  // ── Load alerts from localStorage (no DB table needed) ───────────────────
  useEffect(() => {
    const saved = localStorage.getItem('price_alerts');
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  const saveAlerts = (list) => {
    setAlerts(list);
    localStorage.setItem('price_alerts', JSON.stringify(list));
  };

  // ── Poll prices every 30s and check triggers ──────────────────────────────
  useEffect(() => {
    if (!alerts.length) return;

    const checkPrices = async () => {
      const symbols = [...new Set(alerts.map((a) => a.symbol))];
      const results = await Promise.allSettled(
        symbols.map((sym) =>
          fetch(`/api/market/quote?symbol=${sym}`).then((r) => r.json()),
        ),
      );
      const map = {};
      symbols.forEach((sym, i) => {
        if (results[i].status === 'fulfilled') map[sym] = results[i].value?.price ?? 0;
      });
      setLivePrices(map);

      // Check triggers
      const newTriggered = [];
      alerts.forEach((alert) => {
        if (alert.triggered) return;
        const price = map[alert.symbol];
        if (!price) return;
        const hit = alert.direction === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice;
        if (hit) {
          newTriggered.push({ ...alert, triggeredAt: Date.now() });
        }
      });

      if (newTriggered.length) {
        setTriggered(newTriggered);
        // Mark as triggered
        const updated = alerts.map((a) =>
          newTriggered.find((t) => t.id === a.id) ? { ...a, triggered: true } : a,
        );
        saveAlerts(updated);
        // Auto-dismiss toasts after 5s
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setTriggered([]), 5000);
      }
    };

    checkPrices();
    const interval = setInterval(checkPrices, 30_000);
    return () => clearInterval(interval);
  }, [alerts]);

  const handleAdd = () => {
    const sym = symbol.trim().toUpperCase();
    const price = parseFloat(targetPrice);
    if (!sym || !/^[A-Z]{1,5}$/.test(sym)) { setFormErr('Enter a valid ticker (e.g. AAPL)'); return; }
    if (!price || price <= 0) { setFormErr('Enter a valid target price'); return; }

    const newAlert = {
      id:          Date.now(),
      symbol:      sym,
      targetPrice: price,
      direction,
      triggered:   false,
      createdAt:   Date.now(),
    };
    saveAlerts([newAlert, ...alerts]);
    setSymbol('');
    setTargetPrice('');
    setDirection('above');
    setFormErr('');
    setShowForm(false);
  };

  const removeAlert = (id) => saveAlerts(alerts.filter((a) => a.id !== id));
  const resetAlert  = (id) => saveAlerts(alerts.map((a) => a.id === id ? { ...a, triggered: false } : a));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AlertToast alerts={triggered} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Price Alerts</h1>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
            <Plus className="w-5 h-5" /> New Alert
          </Button>
        </motion.div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="card-premium space-y-4">
                <h2 className="text-sm font-semibold">Set Price Alert</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Ticker Symbol</label>
                    <input type="text" value={symbol} onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setFormErr(''); }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground uppercase focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Target Price ($)</label>
                    <input type="number" min="0" step="0.01" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Trigger When</label>
                    <div className="flex bg-foreground/5 border border-border rounded-lg p-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {['above', 'below'].map((d) => (
                        <button key={d} onClick={() => setDirection(d)}
                          className={cn('flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
                            direction === d ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
                          {d === 'above' ? '↑ Above' : '↓ Below'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {formErr && <p className="text-xs text-rose-400">{formErr}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleAdd} className="gap-2"><Check className="w-4 h-4" /> Set Alert</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert list */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {alerts.length === 0 ? (
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No alerts set. Click "New Alert" to get started.</p>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const livePrice = livePrices[alert.symbol];
              const up = alert.direction === 'above';
              return (
                <motion.div key={alert.id} variants={fadeUp} whileHover={{ y: -1 }}>
                  <Card className={cn('card-premium flex items-center justify-between gap-4',
                    alert.triggered && 'border-emerald-500/30 bg-emerald-500/5')}>
                    <div className="flex items-center gap-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        up ? 'bg-emerald-500/15' : 'bg-rose-500/15')}>
                        {up ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{alert.symbol}</span>
                          {alert.triggered && (
                            <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Triggered</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Alert when price goes {alert.direction} <span className="font-mono text-foreground">${fmt(alert.targetPrice)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {livePrice && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Live</p>
                          <p className="font-mono text-sm font-semibold tabular-nums">${fmt(livePrice)}</p>
                        </div>
                      )}
                      {alert.triggered && (
                        <button onClick={() => resetAlert(alert.id)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                          Reset
                        </button>
                      )}
                      <button onClick={() => removeAlert(alert.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

      </div>
    </div>
  );
}
