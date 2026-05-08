import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Building2, Search, Plus, BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/util';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STOCKS = {
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    status: 'Open',
    price: 178.92,
    change: +2.41,
    description: 'Apple designs and sells consumer electronics, software, and online services. Known for the iPhone, Mac, iPad, and a growing ecosystem of subscription services.',
    metrics: {
      'Market Cap':  '$2.78T',
      'P/E Ratio':   '28.4x',
      '52W High':    '$198.23',
      '52W Low':     '$124.17',
      'Avg Volume':  '61.3M',
      'Div Yield':   '0.54%',
      'Beta':        '1.29',
      'EPS':         '$6.43',
    },
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    sector: 'Technology',
    status: 'Open',
    price: 378.91,
    change: +3.12,
    description: 'Microsoft develops and licenses software, hardware, and cloud services. Azure, Office 365, and LinkedIn are among its flagship products driving enterprise growth.',
    metrics: {
      'Market Cap':  '$2.81T',
      'P/E Ratio':   '35.1x',
      '52W High':    '$420.82',
      '52W Low':     '$275.37',
      'Avg Volume':  '28.7M',
      'Div Yield':   '0.72%',
      'Beta':        '0.91',
      'EPS':         '$11.45',
    },
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Discretionary',
    status: 'Open',
    price: 245.67,
    change: -2.89,
    description: 'Tesla designs and manufactures electric vehicles, energy storage systems, and solar products. Its Autopilot and Full Self-Driving software are central to its long-term vision.',
    metrics: {
      'Market Cap':  '$781.4B',
      'P/E Ratio':   '72.3x',
      '52W High':    '$299.29',
      '52W Low':     '$138.80',
      'Avg Volume':  '88.4M',
      'Div Yield':   '—',
      'Beta':        '2.31',
      'EPS':         '$3.40',
    },
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    sector: 'Technology',
    status: 'Open',
    price: 485.23,
    change: +4.20,
    description: 'NVIDIA designs graphics processing units and system-on-chip units. Its GPUs power AI training workloads, data centers, gaming, and autonomous vehicle platforms.',
    metrics: {
      'Market Cap':  '$1.20T',
      'P/E Ratio':   '108.6x',
      '52W High':    '$502.66',
      '52W Low':     '$108.13',
      'Avg Volume':  '42.1M',
      'Div Yield':   '0.04%',
      'Beta':        '1.74',
      'EPS':         '$4.47',
    },
  },
};

const TICKERS = Object.keys(STOCKS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtChange = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

// ─── Chart Placeholder ────────────────────────────────────────────────────────

function ChartPlaceholder() {
  const cols = 12;
  const rows = 5;
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-md">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {Array.from({ length: rows + 1 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0" y1={`${(i / rows) * 100}%`}
            x2="100%" y2={`${(i / rows) * 100}%`}
            stroke="#27272a" strokeWidth="1"
          />
        ))}
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={`${(i / cols) * 100}%`} y1="0"
            x2={`${(i / cols) * 100}%`} y2="100%"
            stroke="#27272a" strokeWidth="1"
          />
        ))}
        {/* Mock price line */}
        <polyline
          points="0,180 60,155 120,165 180,130 240,140 300,100 360,115 420,85 480,95 540,70 600,80 660,55 720,65"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Gradient fill under line */}
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points="0,180 60,155 120,165 180,130 240,140 300,100 360,115 420,85 480,95 540,70 600,80 660,55 720,65 720,224 0,224"
          fill="url(#chartFill)"
          stroke="none"
        />
      </svg>

      {/* Axis labels */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3 text-[10px] text-muted-foreground font-mono select-none">
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 bg-background/70 backdrop-blur-sm border border-border rounded-full px-4 py-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Interactive Chart · Powered by Recharts</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pulse Button ─────────────────────────────────────────────────────────────

function WatchlistButton() {
  return (
    <>
      <style>{`
        .pulse-btn { position: relative; }
        .pulse-btn::before,
        .pulse-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(255,255,255,0.3);
          opacity: 0;
          pointer-events: none;
        }
        .pulse-btn:hover::before {
          animation: pulse-ring 0.9s ease-out forwards;
        }
        .pulse-btn:hover::after {
          animation: pulse-ring 0.9s 0.22s ease-out forwards;
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.5; }
          100% { transform: scale(1.55); opacity: 0;   }
        }
      `}</style>
      <Button className="pulse-btn gap-2">
        <Plus className="w-4 h-4" />
        Add to Watchlist
      </Button>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function StockDetail() {
  // ── Ticker state synced with URL ──────────────────────────────────────────
  const [ticker, setTicker] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const t = (p.get('ticker') || 'AAPL').toUpperCase();
    return STOCKS[t] ? t : 'AAPL';
  });

  const [input, setInput] = useState(ticker);
  const [error, setError]   = useState('');
  const inputRef = useRef(null);

  const stock = STOCKS[ticker];
  const up = stock.change >= 0;

  const applyTicker = (raw) => {
    const t = raw.trim().toUpperCase();
    if (!t) return;
    if (!STOCKS[t]) {
      setError(`"${t}" not found. Try: ${TICKERS.join(', ')}`);
      return;
    }
    setError('');
    setTicker(t);
    setInput(t);
    const params = new URLSearchParams(window.location.search);
    params.set('ticker', t);
    window.history.replaceState(null, '', `?${params}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyTicker(input);
  };

  // Re-key animation on ticker change
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey((k) => k + 1); }, [ticker]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Search Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Stock Detail</p>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Company Research</h1>

          <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(''); }}
                placeholder="Search by ticker (e.g., AAPL, MSFT)"
                className={cn(
                  'w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5',
                  'text-sm text-foreground placeholder:text-muted-foreground font-mono',
                  'focus:outline-none transition-colors duration-150 uppercase',
                )}
              />
            </div>
            <Button type="submit">
              Search
            </Button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Quick-pick chips */}
          <div className="flex gap-2 flex-wrap justify-center">
            {TICKERS.map((t) => (
              <Button
                key={t}
                variant={t === ticker ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyTicker(t)}
                className="font-mono"
              >
                {t}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* ── Content Grid ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={animKey}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >

            {/* ── Company Hero ─────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="card-premium h-full">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold tracking-tight">{stock.name}</h2>
                      <span className="text-xs font-mono bg-card border border-border px-2 py-0.5 rounded text-muted-foreground">
                        {stock.ticker}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          stock.status === 'Open'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-zinc-700/50 text-muted-foreground',
                        )}
                      >
                        {stock.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{stock.sector}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {stock.description}
                    </p>
                  </div>
                </div>

                {/* Price row */}
                <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                    <span className="font-mono text-4xl font-bold tabular-nums tracking-tight">
                      ${fmt(stock.price)}
                    </span>
                  </div>
                  <div className={cn('flex items-center gap-1.5 mb-1', up ? 'text-emerald-400' : 'text-red-400')}>
                    {up ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span className="font-mono text-xl font-semibold tabular-nums">
                      {fmtChange(stock.change)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">today</span>
                  </div>
                  <div className="ml-auto">
                    <WatchlistButton />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Chart Placeholder ─────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <motion.div whileHover={{ y: -2 }} className="h-full">
                <Card className="card-premium h-full flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold tracking-tight">Price Chart</p>
                    <span className="text-xs text-muted-foreground font-mono">1Y</span>
                  </div>
                  <ChartPlaceholder />
                </Card>
              </motion.div>
            </motion.div>

            {/* ── Key Metrics Grid ──────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <p className="text-sm font-semibold tracking-tight mb-3">Key Metrics</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stock.metrics).map(([label, value], i) => (
                  <motion.div
                    key={label}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    custom={i}
                  >
                    <Card className="card-premium flex flex-col gap-1">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-bold tabular-nums font-mono tracking-tight">
                        {value}
                      </p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
