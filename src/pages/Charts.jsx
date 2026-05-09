import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/util';

// ─── Asset catalogue ──────────────────────────────────────────────────────────

const ASSETS = [
  { id: 'AAPL',  label: 'AAPL  — Apple Inc.',       base: 189,   vol: 4   },
  { id: 'MSFT',  label: 'MSFT  — Microsoft Corp.',   base: 415,   vol: 6   },
  { id: 'SPY',   label: 'SPY   — S&P 500 ETF',       base: 478,   vol: 3   },
  { id: 'BTC',   label: 'BTC   — Bitcoin',           base: 62000, vol: 2000 },
];

const ANALYTICS = {
  AAPL: { beta: '1.29', volume: '55.8M', rsi: '58.4' },
  MSFT: { beta: '0.91', volume: '22.1M', rsi: '62.1' },
  SPY:  { beta: '1.00', volume: '88.3M', rsi: '54.7' },
  BTC:  { beta: '1.74', volume: '31.2B', rsi: '67.3' },
};

const RANGES = ['1D', '1W', '1M', '1Y'];
const CHART_TYPES = ['Line', 'Area', 'Bar'];

// ─── Mock data generator ──────────────────────────────────────────────────────

function generateData(assetId, range) {
  const asset  = ASSETS.find((a) => a.id === assetId);
  const points = range === '1D' ? 24 : range === '1W' ? 7 : range === '1M' ? 30 : 52;
  const labels = range === '1D'
    ? Array.from({ length: points }, (_, i) => `${i}:00`)
    : range === '1W'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : range === '1M'
    ? Array.from({ length: points }, (_, i) => `Day ${i + 1}`)
    : Array.from({ length: points }, (_, i) => `W${i + 1}`);

  let price = asset.base;
  return labels.map((name) => {
    price = +(price + (Math.random() - 0.48) * asset.vol).toFixed(2);
    return { name, value: price };
  });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-semibold">
        {payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ─── Toggle button ────────────────────────────────────────────────────────────

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/8',
      )}
    >
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Charts() {
  const [asset,     setAsset]     = useState('AAPL');
  const [chartType, setChartType] = useState('Area');
  const [range,     setRange]     = useState('1M');
  const [search,    setSearch]    = useState('');
  const [filtered,  setFiltered]  = useState(ASSETS);
  const [animKey,   setAnimKey]   = useState(0);
  const debounceRef = useRef(null);

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = val.trim().toLowerCase();
      setFiltered(q ? ASSETS.filter((a) => a.id.toLowerCase().includes(q) || a.label.toLowerCase().includes(q)) : ASSETS);
    }, 300);
  };

  // ── Re-animate on asset change ────────────────────────────────────────────
  const selectAsset = (id) => {
    setAsset(id);
    setAnimKey((k) => k + 1);
  };

  const data     = useMemo(() => generateData(asset, range), [asset, range]);
  const metrics  = ANALYTICS[asset];
  const isUp     = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const color    = isUp ? '#10b981' : '#f43f5e';   // emerald / rose
  const gradId   = `grad-${asset}`;
  const gridColor = 'var(--color-border)';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* ── Page title ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight">Charts &amp; Analytics</h1>
        </motion.div>

        {/* ── Controls card ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
        >
          <Card className="card-premium space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className={cn(
                  'w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5',
                  'text-sm text-foreground focus:outline-none transition-colors duration-150',
                )}
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Asset select */}
              <div className="flex flex-wrap gap-2">
                {filtered.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => selectAsset(a.id)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-mono rounded-md border transition-all duration-150',
                      asset === a.id
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                    )}
                  >
                    {a.id}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <span className="text-xs text-muted-foreground self-center">No assets match.</span>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Chart type toggle */}
                <div className="flex bg-card border border-border rounded-lg p-1 gap-0.5">
                  {CHART_TYPES.map((t) => (
                    <ToggleBtn key={t} active={chartType === t} onClick={() => setChartType(t)}>{t}</ToggleBtn>
                  ))}
                </div>

                {/* Range toggle */}
                <div className="flex bg-card border border-border rounded-lg p-1 gap-0.5">
                  {RANGES.map((r) => (
                    <ToggleBtn key={r} active={range === r} onClick={() => setRange(r)}>{r}</ToggleBtn>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Main chart ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${animKey}-${chartType}-${range}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            layout
          >
            <Card className="card-premium">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold">{asset} — {range} Price History</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {data[data.length - 1]?.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className={cn('ml-2', isUp ? 'text-emerald-500' : 'text-rose-500')}>
                      {isUp ? '▲' : '▼'} {Math.abs(((data[data.length - 1]?.value - data[0]?.value) / data[0]?.value) * 100).toFixed(2)}%
                    </span>
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-mono px-2 py-1 rounded-full border',
                  isUp ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400',
                )}>
                  {chartType}
                </span>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'Line' ? (
                  <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
                  </LineChart>
                ) : chartType === 'Area' ? (
                  <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={color} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill={color} opacity={0.8} radius={[2, 2, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ── Analytics metrics row ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { label: 'Volatility (Beta)', value: metrics.beta },
            { label: 'Avg Volume',        value: metrics.volume },
            { label: 'RSI (14)',          value: metrics.rsi },
          ].map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: 'easeOut' }}
              whileHover={{ y: -2 }}
            >
              <Card className="card-premium flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="font-mono text-2xl font-bold tabular-nums tracking-tight">{value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
