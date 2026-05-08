import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/util';

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTORS = [
  {
    id: 'tech',
    name: 'Technology',
    change: +3.24,
    topStock: 'NVDA',
    bars: [40, 55, 45, 70, 60, 80, 75, 90, 85, 95],
  },
  {
    id: 'finance',
    name: 'Finance',
    change: +1.08,
    topStock: 'JPM',
    bars: [60, 58, 65, 62, 70, 68, 72, 69, 74, 71],
  },
  {
    id: 'energy',
    name: 'Energy',
    change: -2.15,
    topStock: 'XOM',
    bars: [80, 75, 70, 65, 68, 60, 55, 58, 52, 50],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    change: +0.87,
    topStock: 'UNH',
    bars: [50, 52, 55, 53, 58, 56, 60, 59, 63, 62],
  },
  {
    id: 'consumer',
    name: 'Consumer',
    change: -0.43,
    topStock: 'AMZN',
    bars: [65, 63, 60, 62, 58, 60, 56, 58, 54, 55],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    change: +1.62,
    topStock: 'CAT',
    bars: [45, 50, 48, 55, 53, 60, 58, 65, 63, 68],
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    change: -1.34,
    topStock: 'PLD',
    bars: [70, 65, 68, 62, 60, 58, 55, 57, 52, 50],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    change: +0.29,
    topStock: 'NEE',
    bars: [55, 56, 54, 57, 55, 58, 56, 59, 57, 60],
  },
];

const GAINERS = [
  { symbol: 'NVDA', price: 485.23, change: +4.20, volume: '42.1M' },
  { symbol: 'MSFT', price: 378.91, change: +3.10, volume: '28.7M' },
  { symbol: 'AAPL', price: 178.92, change: +2.40, volume: '61.3M' },
  { symbol: 'META', price: 312.45, change: +1.50, volume: '19.8M' },
  { symbol: 'CAT',  price: 248.67, change: +1.62, volume: '5.2M'  },
];

const LOSERS = [
  { symbol: 'TSLA', price: 245.67, change: -2.90, volume: '88.4M' },
  { symbol: 'XOM',  price: 104.32, change: -2.15, volume: '22.6M' },
  { symbol: 'PLD',  price: 118.54, change: -1.34, volume: '7.1M'  },
  { symbol: 'GOOGL',price: 142.78, change: -1.20, volume: '31.5M' },
  { symbol: 'AMD',  price: 125.43, change: -0.60, volume: '44.9M' },
];

const INDICES = [
  { name: 'S&P 500',    value: 4_782.82, change: +0.58, status: 'Open'   },
  { name: 'NASDAQ',     value: 14_972.76, change: +1.12, status: 'Open'  },
  { name: 'DOW',        value: 37_440.34, change: +0.22, status: 'Open'  },
  { name: 'FTSE 100',   value: 7_631.74,  change: -0.34, status: 'Closed'},
  { name: 'NIKKEI 225', value: 33_288.29, change: +0.91, status: 'Closed'},
  { name: 'HANG SENG',  value: 16_204.55, change: -1.47, status: 'Closed'},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtChange = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

const isUp = (n) => n >= 0;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkline({ bars, up }) {
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-[2px] h-8 mt-3">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={cn('flex-1 rounded-sm', up ? 'bg-emerald-500/70' : 'bg-red-500/70')}
          style={{ height: `${(h / max) * 100}%` }}
          initial={{ scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function SectorCard({ sector, index }) {
  const up = isUp(sector.change);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <Card className="card-premium h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Sector
            </p>
            <h3 className="font-semibold text-base tracking-tight">{sector.name}</h3>
          </div>
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-mono tabular-nums font-medium',
              up ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {fmtChange(sector.change)}
          </span>
        </div>

        <Sparkline bars={sector.bars} up={up} />

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Top stock</span>
          <span className="text-xs font-mono font-semibold text-foreground">{sector.topStock}</span>
        </div>
      </Card>
    </motion.div>
  );
}

function MoverRow({ item, index }) {
  const up = isUp(item.change);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: up ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      className={cn(
        'flex items-center justify-between px-4 py-2.5 rounded-md',
        'transition-colors duration-150 hover:bg-zinc-800/60 cursor-default',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
            up ? 'bg-emerald-500/15' : 'bg-red-500/15',
          )}
        >
          {up
            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
        </div>
        <span className="font-mono font-semibold text-sm text-foreground">{item.symbol}</span>
      </div>

      <div className="flex items-center gap-5 text-sm tabular-nums font-mono">
        <span className="text-muted-foreground">${fmt(item.price)}</span>
        <span className={cn('font-medium w-16 text-right', up ? 'text-emerald-400' : 'text-red-400')}>
          {fmtChange(item.change)}
        </span>
        <span className="text-muted-foreground text-xs w-14 text-right hidden sm:block">
          {item.volume}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketOverview() {
  // ── Filter state synced with URL ──────────────────────────────────────────
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') ?? '';
  });

  const handleQuery = (e) => {
    const value = e.target.value;
    setQuery(value);
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    window.history.replaceState(null, '', `?${params}`);
  };

  const q = query.toLowerCase().trim();

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredSectors = useMemo(
    () => (q ? SECTORS.filter((s) => s.name.toLowerCase().includes(q) || s.topStock.toLowerCase().includes(q)) : SECTORS),
    [q],
  );

  const filteredIndices = useMemo(
    () => (q ? INDICES.filter((idx) => idx.name.toLowerCase().includes(q)) : INDICES),
    [q],
  );

  // ── Section entrance variants ─────────────────────────────────────────────
  const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── Page Header + Filter ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Overview</h1>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleQuery}
              placeholder="Filter sectors or indices..."
              className={cn(
                'w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5',
                'text-sm text-foreground placeholder:text-muted-foreground',
                'focus:outline-none transition-colors duration-150',
              )}
            />
          </div>
        </motion.div>

        {/* ── 1. Sector Performance Grid ───────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-4">Sector Performance</h2>

          <AnimatePresence mode="popLayout">
            {filteredSectors.length > 0 ? (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
              >
                <AnimatePresence>
                  {filteredSectors.map((sector, i) => (
                    <SectorCard key={sector.id} sector={sector} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.p
                key="empty-sectors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground py-6"
              >
                No sectors match &ldquo;{query}&rdquo;.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── 2. Top Movers ────────────────────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-4">Top Movers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gainers */}
            <Card className="card-premium !p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Gainers</span>
              </div>
              <div className="px-1 py-1">
                <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Symbol</span>
                  <div className="flex gap-5">
                    <span>Price</span>
                    <span className="w-16 text-right">Chg %</span>
                    <span className="w-14 text-right hidden sm:block">Volume</span>
                  </div>
                </div>
                <AnimatePresence>
                  {GAINERS.map((item, i) => (
                    <MoverRow key={item.symbol} item={item} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </Card>

            {/* Losers */}
            <Card className="card-premium !p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Losers</span>
              </div>
              <div className="px-1 py-1">
                <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Symbol</span>
                  <div className="flex gap-5">
                    <span>Price</span>
                    <span className="w-16 text-right">Chg %</span>
                    <span className="w-14 text-right hidden sm:block">Volume</span>
                  </div>
                </div>
                <AnimatePresence>
                  {LOSERS.map((item, i) => (
                    <MoverRow key={item.symbol} item={item} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </motion.section>

        {/* ── 3. Global Indices Table ──────────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="pb-8"
        >
          <h2 className="text-lg font-semibold tracking-tight mb-4">Global Indices</h2>

          <Card className="card-premium !p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Daily Change</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredIndices.length > 0 ? (
                    filteredIndices.map((idx, i) => {
                      const up = isUp(idx.change);
                      return (
                        <TableRow key={idx.name} className="group">
                          <TableCell>
                            <motion.span
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.05 }}
                              className="font-medium text-foreground"
                            >
                              {idx.name}
                            </motion.span>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-foreground">
                            {idx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-end gap-1 font-mono tabular-nums text-sm font-medium',
                                up ? 'text-emerald-400' : 'text-red-400',
                              )}
                            >
                              {up
                                ? <TrendingUp className="w-3 h-3" />
                                : <TrendingDown className="w-3 h-3" />}
                              {fmtChange(idx.change)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                'inline-block text-xs font-medium px-2 py-0.5 rounded-full',
                                idx.status === 'Open'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-zinc-700/50 text-muted-foreground',
                              )}
                            >
                              {idx.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                        No indices match &ldquo;{query}&rdquo;.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </Card>
        </motion.section>

      </div>
    </div>
  );
}
