import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/util';

// ─── Mock base data ───────────────────────────────────────────────────────────

const COMPANY_NAMES = {
  AAPL:  'Apple Inc.',
  MSFT:  'Microsoft Corp.',
  GOOGL: 'Alphabet Inc.',
  AMZN:  'Amazon.com Inc.',
  TSLA:  'Tesla Inc.',
  NVDA:  'NVIDIA Corp.',
  META:  'Meta Platforms',
};

const BASE_PRICES = {
  AAPL: 189.30, MSFT: 415.50, GOOGL: 172.63, AMZN: 185.40,
  TSLA: 177.90, NVDA: 890.00, META: 502.30,
};

const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'].map((sym) => ({
  id:        sym,
  symbol:    sym,
  company:   COMPANY_NAMES[sym] ?? sym,
  price:     BASE_PRICES[sym] ?? 100,
  change24h: +(Math.random() * 4 - 2).toFixed(2),
  flash:     false,
}));

// ─── 7-day chart mock data ────────────────────────────────────────────────────

const CHART_DATA = [
  { day: 'Mon', value: 12400 },
  { day: 'Tue', value: 12850 },
  { day: 'Wed', value: 12600 },
  { day: 'Thu', value: 13100 },
  { day: 'Fri', value: 13450 },
  { day: 'Sat', value: 13200 },
  { day: 'Sun', value: 13780 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><div className="h-4 w-14 bg-zinc-800 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-36 bg-zinc-800 rounded animate-pulse" /></TableCell>
      <TableCell className="text-right"><div className="h-4 w-20 bg-zinc-800 rounded animate-pulse ml-auto" /></TableCell>
      <TableCell className="text-right"><div className="h-4 w-16 bg-zinc-800 rounded animate-pulse ml-auto" /></TableCell>
      <TableCell><div className="h-4 w-6 bg-zinc-800 rounded animate-pulse mx-auto" /></TableCell>
    </TableRow>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-mono shadow-lg">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-semibold">${fmt(payload[0].value)}</p>
    </div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const rowVariant = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Watchlist() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [input,     setInput]     = useState('');
  const [toast,     setToast]     = useState('');
  const [error,     setError]     = useState('');
  const toastTimer  = useRef(null);

  // ── Simulate 1s initial load ──────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setItems(INITIAL_WATCHLIST);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  // ── Real-time price simulation ±0.3% every 2.5s ───────────────────────────
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          const delta    = item.price * (Math.random() * 0.006 - 0.003);
          const newPrice = +(item.price + delta).toFixed(2);
          const newChg   = +(item.change24h + delta * 0.1).toFixed(2);
          return { ...item, price: newPrice, change24h: newChg, flash: true };
        })
      );
      // Clear flash after 600ms
      setTimeout(() => {
        setItems((prev) => prev.map((item) => ({ ...item, flash: false })));
      }, 600);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Quick add ─────────────────────────────────────────────────────────────
  const handleAdd = (e) => {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (!sym) { setError('Enter a ticker symbol.'); return; }
    if (items.find((i) => i.id === sym)) { setError(`${sym} is already in your watchlist.`); return; }
    setError('');
    const newItem = {
      id:        sym,
      symbol:    sym,
      company:   COMPANY_NAMES[sym] ?? sym,
      price:     BASE_PRICES[sym] ?? +(100 + Math.random() * 900).toFixed(2),
      change24h: +(Math.random() * 4 - 2).toFixed(2),
      flash:     false,
    };
    setItems((prev) => [newItem, ...prev]);
    setInput('');
    clearTimeout(toastTimer.current);
    setToast(`${sym} added to watchlist`);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Header + Quick Add ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight">My Watchlist</h1>
          </div>

          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
              className={cn(
                'flex-1 min-w-48 bg-card border border-border rounded-lg px-4 py-3',
                'text-base font-mono text-foreground uppercase tracking-widest',
                'focus:outline-none transition-colors duration-150',
              )}
            />
            <Button type="submit" className="gap-2">
              <Plus className="w-5 h-5" />
              Add to Watchlist
            </Button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-rose-400">{error}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Toast ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed top-6 right-6 z-50 bg-card border border-border rounded-lg px-4 py-3 text-sm font-medium shadow-xl"
            >
              ✓ {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          <Card className="card-premium !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">24h Change</TableHead>
                    <TableHead className="text-center w-14">Remove</TableHead>
                  </TableRow>
                </TableHeader>

                <AnimatePresence mode="wait">
                  {loading ? (
                    /* Skeleton rows */
                    <motion.tbody
                      key="skeleton"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.4 } }}
                      className="[&_tr:last-child]:border-0"
                    >
                      {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                    </motion.tbody>
                  ) : (
                    /* Real rows */
                    <motion.tbody
                      key="data"
                      variants={stagger}
                      initial="hidden"
                      animate="visible"
                      className="[&_tr:last-child]:border-0"
                    >
                      <AnimatePresence>
                        {items.map((item) => {
                          const up = item.change24h >= 0;
                          return (
                            <motion.tr
                              key={item.id}
                              layout
                              variants={rowVariant}
                              exit="exit"
                              animate={item.flash
                                ? { backgroundColor: ['transparent', up ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', 'transparent'] }
                                : { backgroundColor: 'transparent' }
                              }
                              transition={{ duration: 0.6 }}
                              className="border-b border-border hover:bg-foreground/5 cursor-default"
                            >
                              <TableCell>
                                <span className="font-mono font-semibold text-sm">{item.symbol}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">{item.company}</span>
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums text-sm">
                                ${fmt(item.price)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  'inline-flex items-center justify-end gap-1 font-mono tabular-nums text-sm font-medium',
                                  up ? 'text-emerald-500' : 'text-rose-500',
                                )}>
                                  {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                  {up ? '+' : ''}{item.change24h.toFixed(2)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  onClick={() => handleRemove(item.id)}
                                  className="w-8 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>

                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                            Your watchlist is empty. Add a ticker above.
                          </TableCell>
                        </TableRow>
                      )}
                    </motion.tbody>
                  )}
                </AnimatePresence>
              </Table>
            </div>
          </Card>
        </motion.div>

        {/* ── Vitals Chart ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-4">Watchlist Value — 7 Days</h2>
          <Card className="card-premium">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CHART_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ffffff" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#ffffff', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
