import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, X, ChevronRight, ChevronLeft, Check, Briefcase, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/util';
import { supabase } from '@/lib/supabase';

// ─── Mock prices ──────────────────────────────────────────────────────────────

const CURRENT_PRICES = {
  AAPL: 189.30, MSFT: 415.50, TSLA: 177.90,
  NVDA: 890.00, GOOGL: 172.63, AMZN: 185.40, META: 502.30,
};

// ─── Initial holdings ─────────────────────────────────────────────────────────

const INITIAL_HOLDINGS = [
  { id: 1, symbol: 'AAPL', shares: 10, buyPrice: 155.00 },
  { id: 2, symbol: 'MSFT', shares: 5,  buyPrice: 290.00 },
  { id: 3, symbol: 'TSLA', shares: 8,  buyPrice: 210.00 },
];

// ─── Sector allocation mock data ──────────────────────────────────────────────

const SECTOR_DATA = [
  { name: 'Technology', value: 60 },
  { name: 'Finance',    value: 20 },
  { name: 'Automotive', value: 15 },
  { name: 'Other',      value: 5  },
];

const SECTOR_COLORS = ['#e4e4e7', '#a1a1aa', '#71717a', '#3f3f46'];

// ─── Analytics mock metrics ───────────────────────────────────────────────────

const ANALYTICS = [
  { label: 'Total Return',  value: '+24.38%', up: true  },
  { label: 'Max Drawdown',  value: '-12.54%', up: false },
  { label: 'Sharpe Ratio',  value: '1.84',    up: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calcRow(h) {
  const current = CURRENT_PRICES[h.symbol] ?? h.buyPrice;
  const pnl     = (current - h.buyPrice) * h.shares;
  const pnlPct  = ((current - h.buyPrice) / h.buyPrice) * 100;
  const value   = current * h.shares;
  return { ...h, current, pnl, pnlPct, value };
}

function exportCSV(holdings) {
  const rows = holdings.map(calcRow);
  const header = ['Symbol','Shares','Buy Price','Current Price','Value','P&L ($)','P&L (%)'];
  const lines  = rows.map((r) =>
    [r.symbol, r.shares, r.buyPrice.toFixed(2), r.current.toFixed(2),
     r.value.toFixed(2), r.pnl.toFixed(2), r.pnlPct.toFixed(2) + '%'].join(',')
  );
  const csv  = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'portfolio.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Animation variants ───────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:   (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }),
};

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-mono shadow-lg">
      <p className="text-foreground font-semibold">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value}%</p>
    </div>
  );
}

// ─── Multi-step Add Asset Modal ───────────────────────────────────────────────

const EMPTY_FORM = { step: 1, ticker: '', qty: '', buyPrice: '' };

function AddAssetModal({ onClose, onConfirm }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [dir,    setDir]    = useState(1);
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const next = () => {
    setError('');
    if (form.step === 1 && !form.ticker.trim()) { setError('Enter a ticker symbol.'); return; }
    if (form.step === 2) {
      if (!form.qty || Number(form.qty) <= 0)           { setError('Enter a valid quantity.'); return; }
      if (!form.buyPrice || Number(form.buyPrice) <= 0) { setError('Enter a valid buy price.'); return; }
    }
    setDir(1);
    setForm((f) => ({ ...f, step: f.step + 1 }));
  };

  const back = () => { setError(''); setDir(-1); setForm((f) => ({ ...f, step: f.step - 1 })); };

  const confirm = async () => {
    setSaving(true);
    setError('');

    try {
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'supabase.auth.getSession', lastError: null } }));
      }

      console.log('Supabase auth.getSession: start');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Supabase getSession Error:', sessionError);
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'supabase.auth.getSession', lastError: sessionError } }));
        }
        alert(`Failed to get session: ${sessionError.message}`);
        setSaving(false);
        return;
      }
      console.log('✅ Supabase getSession:', session);
      if (!session) { alert("Please login"); setSaving(false); return; }
      const userId = session.user.id;

      const formData = {
        symbol: form.ticker,
        companyName: '',
        quantity: form.qty,
        buyPrice: form.buyPrice,
        buyDate: new Date().toISOString().split('T')[0],
      };

      const payload = {
        user_id: userId, // CRITICAL
        symbol: formData.symbol?.toUpperCase?.() || formData.symbol,
        company_name: formData.companyName || formData.symbol,
        quantity: Number(formData.quantity),
        buy_price: Number(formData.buyPrice),
        buy_date: formData.buyDate || new Date().toISOString().split('T')[0]
      };

      console.log('Attempting insert:', payload);
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'portfolio.insert', lastDbOperation: 'portfolio.insert', lastPayload: payload, lastError: null, userId } }));
      }

      const { data, error } = await supabase
        .from('portfolio')
        .insert([payload])
        .select(); // Returns inserted row

      if (error) {
        console.error('❌ Supabase Insert Error:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'portfolio.insert', lastDbOperation: 'portfolio.insert', lastError: error } }));
        }
        alert(`Failed to save: ${error.message}`);
        setSaving(false);
        return;
      }

      console.log('✅ Supabase Insert Success:', data);
      if (data?.[0]) {
        console.log('✅ Insert succeeded:', data[0]);
        const newHolding = {
          id:       data[0].id,
          symbol:   data[0].symbol,
          shares:   data[0].quantity,
          buyPrice: data[0].buy_price,
        };
        onConfirm(newHolding);
        setForm(EMPTY_FORM);
        onClose();
      }

    } catch (err) {
      console.error('[portfolio confirm]', err);
      setError('Unexpected error: ' + err.message);
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Card className="card-premium overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Add Asset</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Step {form.step} of 3</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  animate={{ width: form.step >= s ? '100%' : '0%' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="relative overflow-hidden min-h-[160px]">
            <AnimatePresence mode="wait" custom={dir}>
              {form.step === 1 && (
                <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-3">
                  <p className="text-sm font-semibold">Ticker Symbol</p>
                  <p className="text-xs text-muted-foreground">Enter the stock ticker you want to add.</p>
                  <input
                    type="text" value={form.ticker}
                    onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-base font-mono text-foreground uppercase tracking-widest focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">e.g. AAPL, MSFT, TSLA, NVDA</p>
                </motion.div>
              )}
              {form.step === 2 && (
                <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-3">
                  <p className="text-sm font-semibold">Quantity &amp; Buy Price</p>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Number of Shares</label>
                    <input type="number" min="0" value={form.qty}
                      onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-base font-mono text-foreground tabular-nums focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Buy Price per Share ($)</label>
                    <input type="number" min="0" step="0.01" value={form.buyPrice}
                      onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-base font-mono text-foreground tabular-nums focus:outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              )}
              {form.step === 3 && (
                <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-1">
                  <p className="text-sm font-semibold mb-3">Review &amp; Confirm</p>
                  {[
                    { label: 'Ticker',     value: form.ticker.toUpperCase() },
                    { label: 'Shares',     value: form.qty },
                    { label: 'Buy Price',  value: `$${Number(form.buyPrice).toFixed(2)}` },
                    { label: 'Total Cost', value: `$${fmt(Number(form.qty) * Number(form.buyPrice))}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-mono font-semibold tabular-nums">{value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-rose-400 mt-3">{error}</motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            {form.step > 1 && (
              <Button variant="outline" onClick={back} className="gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <div className="flex-1" />
            {form.step < 3
              ? <Button onClick={next} className="gap-1.5">Next <ChevronRight className="w-4 h-4" /></Button>
              : <Button onClick={confirm} disabled={saving} className="gap-1.5">
                  {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Confirm</>}
                </Button>
            }
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Portfolio() {
  const [holdings,  setHoldings]  = useState(INITIAL_HOLDINGS);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let active = true;

    const loadHoldings = async () => {
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'supabase.auth.getSession', lastError: null } }));
      }

      console.log('Supabase auth.getSession: start (portfolio load)');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Supabase getSession Error (portfolio load):', sessionError);
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'supabase.auth.getSession', lastError: sessionError } }));
        }
        return;
      }
      console.log('✅ Supabase getSession (portfolio load):', session);
      if (!session) return;

      const userId = session.user.id;

      console.log('Supabase portfolio.select: start');
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'portfolio.select', lastDbOperation: 'portfolio.select', lastError: null, userId } }));
      }

      const { data, error } = await supabase
        .from('portfolio')
        .select('id, symbol, quantity, buy_price, company_name, buy_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase Select Error (portfolio):', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('debug:update', { detail: { lastApiCall: 'portfolio.select', lastDbOperation: 'portfolio.select', lastError: error } }));
        }
        return;
      }

      console.log('✅ Supabase Select Success (portfolio):', data);
      if (!active) return;
      const mapped = (data || []).map((row) => ({
        id: row.id,
        symbol: row.symbol,
        shares: row.quantity,
        buyPrice: row.buy_price,
      }));
      setHoldings(mapped);
    };

    loadHoldings();
    return () => { active = false; };
  }, []);

  const rows       = holdings.map(calcRow);
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost  = rows.reduce((s, r) => s + r.shares * r.buyPrice, 0);
  const totalPnl   = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const pnlUp      = totalPnl >= 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => exportCSV(holdings)} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-5 h-5" /> Add Asset
            </Button>
          </div>
        </motion.div>

        {/* ── Summary cards ───────────────────────────────────────────── */}
        <motion.div
          variants={stagger} initial="hidden" animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <motion.div variants={fadeUp} whileHover={{ y: -2, scale: 1.01 }}>
            <Card className="card-premium flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Portfolio Value</p>
              <p className="font-mono text-3xl font-bold tabular-nums tracking-tight">${fmt(totalValue)}</p>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} whileHover={{ y: -2, scale: 1.01 }}>
            <Card className="card-premium flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total P&amp;L</p>
              <div className={cn('flex items-center gap-2', pnlUp ? 'text-emerald-500' : 'text-rose-500')}>
                {pnlUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <p className="font-mono text-3xl font-bold tabular-nums tracking-tight">
                  {pnlUp ? '+' : ''}{fmt(totalPnl)}
                </p>
              </div>
              <p className={cn('font-mono text-sm tabular-nums', pnlUp ? 'text-emerald-500' : 'text-rose-500')}>
                {pnlUp ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </p>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} whileHover={{ y: -2, scale: 1.01 }}>
            <Card className="card-premium flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Assets Held</p>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <p className="font-mono text-3xl font-bold tabular-nums tracking-tight">{holdings.length}</p>
              </div>
              <p className="text-xs text-muted-foreground">positions open</p>
            </Card>
          </motion.div>
        </motion.div>

        {/* ── Holdings Table ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Holdings</h2>
            <span className="text-xs text-muted-foreground font-mono">{holdings.length} positions</span>
          </div>

          <Card className="card-premium !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">P&amp;L ($)</TableHead>
                    <TableHead className="text-right">P&amp;L (%)</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <motion.tbody
                  variants={stagger} initial="hidden" animate="visible"
                  className="[&_tr:last-child]:border-0"
                >
                  {rows.map((row) => {
                    const up = row.pnl >= 0;
                    return (
                      <motion.tr
                        key={row.id} variants={fadeUp}
                        className="border-b border-border transition-colors hover:bg-foreground/5"
                      >
                        <TableCell><span className="font-mono font-semibold text-sm">{row.symbol}</span></TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm">{row.shares}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm text-muted-foreground">${fmt(row.buyPrice)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm">${fmt(row.current)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm">${fmt(row.value)}</TableCell>
                        <TableCell className={cn('text-right font-mono tabular-nums text-sm font-medium', up ? 'text-emerald-500' : 'text-rose-500')}>
                          {up ? '+' : ''}{fmt(row.pnl)}
                        </TableCell>
                        <TableCell className={cn('text-right font-mono tabular-nums text-sm font-medium', up ? 'text-emerald-500' : 'text-rose-500')}>
                          {up ? '+' : ''}{row.pnlPct.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setHoldings((prev) => prev.filter((h) => h.id !== row.id))}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </Table>
            </div>

            {holdings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">No holdings yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Asset" to get started.</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Analytics Panel ──────────────────────────────────────────── */}
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-4">Portfolio Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Pie chart — sector allocation */}
            <motion.div variants={fadeUp} whileHover={{ y: -2 }}>
              <Card className="card-premium flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-tight">Sector Allocation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">By portfolio weight</p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SECTOR_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {SECTOR_DATA.map((_, i) => (
                          <Cell key={i} fill={SECTOR_COLORS[i]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Manual legend */}
                <div className="flex flex-wrap gap-3">
                  {SECTOR_DATA.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SECTOR_COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">{s.name}</span>
                      <span className="text-xs font-mono text-foreground">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Metric cards */}
            <motion.div variants={fadeUp} className="flex flex-col gap-4">
              <p className="text-sm font-semibold tracking-tight">Performance Metrics</p>
              {ANALYTICS.map(({ label, value, up }, i) => (
                <motion.div key={label} variants={fadeUp} whileHover={{ y: -2 }} custom={i}>
                  <Card className="card-premium flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={cn(
                      'font-mono text-xl font-bold tabular-nums tracking-tight',
                      label === 'Sharpe Ratio' ? 'text-foreground' : up ? 'text-emerald-500' : 'text-rose-500',
                    )}>
                      {value}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>

      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <AddAssetModal
            onClose={() => setShowModal(false)}
            onConfirm={(item) => setHoldings((prev) => [...prev, item])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
