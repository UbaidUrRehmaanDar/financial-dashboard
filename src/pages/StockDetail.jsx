import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Building2, Plus, BarChart2, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/util';
import { supabase } from '@/lib/supabase';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STOCKS = {
  AAPL: {
    name: 'Apple Inc.',
    sector: 'Technology',
    price: 178.42,
    change: 2.34,
    changePct: 1.33,
    description: 'Designs and manufactures consumer electronics and software.',
    metrics: { mktCap: '2.8T', pe: 28.5, high52: 199.62, low52: 124.17, volume: '52.4M', divYield: '0.5%' },
  },
  MSFT: {
    name: 'Microsoft Corp.',
    sector: 'Technology',
    price: 310.50,
    change: -1.20,
    changePct: -0.38,
    description: 'Develops software, services, and hardware.',
    metrics: { mktCap: '2.3T', pe: 32.1, high52: 384.30, low52: 213.43, volume: '28.1M', divYield: '0.8%' },
  },
  TSLA: {
    name: 'Tesla Inc.',
    sector: 'Automotive',
    price: 175.20,
    change: 8.45,
    changePct: 5.07,
    description: 'Electric vehicle and clean energy company.',
    metrics: { mktCap: '555B', pe: 45.2, high52: 299.29, low52: 101.81, volume: '115.2M', divYield: '0%' },
  },
  NVDA: {
    name: 'NVIDIA Corp.',
    sector: 'Technology',
    price: 890.00,
    change: 38.50,
    changePct: 4.52,
    description: 'Designs GPUs and AI computing platforms.',
    metrics: { mktCap: '2.2T', pe: 68.4, high52: 974.00, low52: 222.97, volume: '48.7M', divYield: '0.03%' },
  },
};

const TICKERS = Object.keys(MOCK_STOCKS);

const fmt = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(n);

// ─── Animation variants ───────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return (
    <motion.div
      className={cn('bg-zinc-800 rounded-lg', className)}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Chart Placeholder ────────────────────────────────────────────────────────

function ChartPlaceholder({ ticker }) {
  const yLabels = ['$900', '$700', '$500', '$300', '$100'];
  return (
    <div className="relative w-full h-64 rounded-md border border-dashed border-border overflow-hidden bg-background">
      {yLabels.map((label, i) => (
        <div
          key={label}
          className="absolute left-0 right-0 flex items-center"
          style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }}
        >
          <span className="text-[10px] font-mono text-muted-foreground w-12 text-right pr-2 select-none shrink-0">
            {label}
          </span>
          <div className="flex-1 border-t border-border/40" />
        </div>
      ))}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ paddingLeft: 48 }}
        preserveAspectRatio="none"
        viewBox="0 0 720 256"
      >
        <polyline
          points="0,220 80,190 160,200 240,160 320,170 400,130 480,145 560,110 640,120 720,90"
          fill="none" stroke="#ffffff" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <defs>
          <linearGradient id={`fill-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points="0,220 80,190 160,200 240,160 320,170 400,130 480,145 560,110 640,120 720,90 720,256 0,256"
          fill={`url(#fill-${ticker})`} stroke="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-md px-4 py-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Interactive Price Chart · Powered by Recharts</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pulse Watchlist Button ───────────────────────────────────────────────────

function WatchlistButton({ onClick, loading }) {
  return (
    <>
      <style>{`
        .watchlist-btn { position: relative; }
        .watchlist-btn::before,
        .watchlist-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(255, 255, 255, 0.35);
          opacity: 0;
          pointer-events: none;
        }
        .watchlist-btn:hover::before {
          animation: btn-pulse 0.85s ease-out forwards;
        }
        .watchlist-btn:hover::after {
          animation: btn-pulse 0.85s 0.2s ease-out forwards;
        }
        @keyframes btn-pulse {
          0%   { transform: scale(1);    opacity: 0.5; }
          100% { transform: scale(1.6);  opacity: 0;   }
        }
      `}</style>
      <Button size="lg" className="watchlist-btn gap-2" onClick={onClick} disabled={loading}>
        <Plus className="w-5 h-5" />
        {loading ? 'Adding...' : 'Add to Watchlist'}
      </Button>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StockDetail() {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedStock,  setSelectedStock]  = useState(null);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [isLoading,      setIsLoading]      = useState(false);
  const [notFound,       setNotFound]       = useState(false);
  const [savingWatch,    setSavingWatch]    = useState(false);
  const [watchMsg,       setWatchMsg]       = useState('');

  const runSearch = (raw) => {
    const t = (raw ?? searchQuery).trim().toUpperCase();
    if (!t) return;
    setNotFound(false);
    setSelectedStock(null);
    setIsLoading(true);
    setTimeout(() => {
      const data = MOCK_STOCKS[t];
      if (data) {
        setSelectedTicker(t);
        setSelectedStock(data);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  const addToWatchlist = async () => {
    if (!selectedTicker || !selectedStock) return;

    setSavingWatch(true);
    setWatchMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setWatchMsg('Please log in first.');
        setSavingWatch(false);
        return;
      }

      const userId = session.user.id;
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id:      userId,
          symbol:       selectedTicker.toUpperCase(),
          company_name: selectedStock.name || selectedTicker,
        })
        .select();

      if (error) {
        console.error('[watchlist insert]', error);
        setWatchMsg('Failed: ' + error.message);
        setSavingWatch(false);
        return;
      }

      setWatchMsg(`${selectedTicker} added to watchlist ✓`);
    } catch (err) {
      console.error('[stock detail watchlist]', err);
      setWatchMsg('Failed: ' + (err?.message || 'Unexpected error'));
    } finally {
      setSavingWatch(false);
    }
  };

  const up = selectedStock ? selectedStock.changePct >= 0 : true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ── Page title ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight">Stock Search &amp; Detail</h1>
        </motion.div>

        {/* ── Search Input ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
        >
          <Card className="card-premium">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value.toUpperCase()); setNotFound(false); }}
                  className={cn(
                    'w-full bg-background border border-border rounded-lg pl-9 pr-4 py-3',
                    'text-base font-mono text-foreground uppercase tracking-wider',
                    'focus:outline-none transition-colors duration-150',
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Searching…' : 'Search'}
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground self-center mr-1">Quick pick:</span>
              {TICKERS.map((t) => (
                <Button
                  key={t}
                  variant={t === selectedTicker ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setSearchQuery(t); runSearch(t); }}
                  className="font-mono"
                >
                  {t}
                </Button>
              ))}
            </div>
          </Card>

          <AnimatePresence>
            {notFound && (
              <motion.p
                key="nf"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-rose-400"
              >
                Ticker not found. Available: {TICKERS.join(', ')}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Loading skeletons ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Magazine grid skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Skeleton className="h-40 lg:col-span-2" />
                <Skeleton className="h-40" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
              <Skeleton className="h-72 w-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Magazine Grid Detail ──────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {selectedStock && !isLoading && (
            <motion.div
              key={selectedTicker}
              variants={stagger}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="space-y-6"
            >

              {/* ── Row 1: Magazine grid — Overview + Price side by side ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Company Overview — spans 2 cols */}
                <motion.section variants={fadeUp} className="lg:col-span-2">
                  <h2 className="text-lg font-semibold tracking-tight mb-3">Company Overview</h2>
                  <motion.div whileHover={{ y: -2 }} className="h-full">
                    <Card className="card-premium h-full">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-2xl font-bold tracking-tight">{selectedStock.name}</h3>
                            <span className="text-xs font-mono bg-background border border-border px-2 py-0.5 rounded text-muted-foreground">
                              {selectedTicker}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{selectedStock.sector}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{selectedStock.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.section>

                {/* Current Price & Daily Change — 1 col */}
                <motion.section variants={fadeUp} className="lg:col-span-1">
                  <h2 className="text-lg font-semibold tracking-tight mb-3">Current Price &amp; Daily Change</h2>
                  <motion.div whileHover={{ y: -2 }} className="h-full">
                    <Card className="card-premium h-full flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Price</p>
                        <span className="font-mono text-4xl font-bold tabular-nums tracking-tight block">
                          ${fmt(selectedStock.price)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Daily Change</p>
                        <div className={cn('flex items-center gap-2', up ? 'text-emerald-500' : 'text-rose-500')}>
                          {up ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          <span className="font-mono text-2xl font-bold tabular-nums">
                            {selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.changePct.toFixed(2)}%
                          </span>
                        </div>
                        <span className={cn('font-mono text-lg font-semibold tabular-nums mt-1 block', up ? 'text-emerald-500' : 'text-rose-500')}>
                          {selectedStock.change >= 0 ? '+' : ''}{fmt(selectedStock.change)}
                        </span>
                      </div>
                      <WatchlistButton onClick={addToWatchlist} loading={savingWatch} />
                      {watchMsg && <p className="text-xs text-emerald-500">{watchMsg}</p>}
                    </Card>
                  </motion.div>
                </motion.section>
              </div>

              {/* ── Row 2: Key Metrics ───────────────────────────────────── */}
              <motion.section variants={fadeUp}>
                <h2 className="text-lg font-semibold tracking-tight mb-3">Key Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Market Cap',     value: selectedStock.metrics.mktCap },
                    { label: 'P/E Ratio',      value: selectedStock.metrics.pe },
                    { label: '52W High',       value: `$${fmt(selectedStock.metrics.high52)}` },
                    { label: '52W Low',        value: `$${fmt(selectedStock.metrics.low52)}` },
                    { label: 'Avg Volume',     value: selectedStock.metrics.volume },
                    { label: 'Dividend Yield', value: selectedStock.metrics.divYield },
                  ].map(({ label, value }, i) => (
                    <motion.div key={label} variants={fadeUp} whileHover={{ y: -2 }} custom={i}>
                      <Card className="card-premium flex flex-col gap-1.5">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-base font-bold font-mono tabular-nums tracking-tight">{value}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              {/* ── Row 3: Chart — full width ────────────────────────────── */}
              <motion.section variants={fadeUp}>
                <h2 className="text-lg font-semibold tracking-tight mb-3">Chart</h2>
                <motion.div whileHover={{ y: -2 }}>
                  <Card className="card-premium flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{selectedTicker} — Price History</p>
                        <p className="text-xs text-muted-foreground mt-0.5">1 Year · Mock data</p>
                      </div>
                      <div className="flex gap-1.5">
                        {['1W','1M','3M','1Y'].map((r) => (
                          <span
                            key={r}
                            className={cn(
                              'text-xs font-mono px-2 py-1 rounded border cursor-default',
                              r === '1Y'
                                ? 'bg-white/10 border-white/20 text-foreground'
                                : 'border-border text-muted-foreground',
                            )}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChartPlaceholder ticker={selectedTicker} />
                  </Card>
                </motion.div>
              </motion.section>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {!selectedStock && !isLoading && !notFound && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Enter a ticker symbol above to view stock details.</p>
              <p className="text-sm text-muted-foreground mt-1">Available: {TICKERS.join(', ')}</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
