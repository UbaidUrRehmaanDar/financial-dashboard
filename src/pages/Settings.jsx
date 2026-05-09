import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, ChevronDown, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/util';

// ─── Theme accent colours ─────────────────────────────────────────────────────

const ACCENTS = [
  { id: 'zinc',    label: 'Default',  hex: '#a1a1aa' },
  { id: 'indigo',  label: 'Indigo',   hex: '#6366f1' },
  { id: 'emerald', label: 'Emerald',  hex: '#10b981' },
  { id: 'rose',    label: 'Rose',     hex: '#f43f5e' },
  { id: 'amber',   label: 'Amber',    hex: '#f59e0b' },
  { id: 'sky',     label: 'Sky',      hex: '#0ea5e9' },
  { id: 'violet',  label: 'Violet',   hex: '#8b5cf6' },
];

// ─── Currency options ─────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar',        icon: '🇺🇸', description: 'United States' },
  { value: 'EUR', label: 'Euro',             icon: '🇪🇺', description: 'European Union' },
  { value: 'GBP', label: 'British Pound',    icon: '🇬🇧', description: 'United Kingdom' },
  { value: 'PKR', label: 'Pakistani Rupee',  icon: '🇵🇰', description: 'Pakistan' },
  { value: 'JPY', label: 'Japanese Yen',     icon: '🇯🇵', description: 'Japan' },
  { value: 'CAD', label: 'Canadian Dollar',  icon: '🇨🇦', description: 'Canada' },
  { value: 'AUD', label: 'Australian Dollar',icon: '🇦🇺', description: 'Australia' },
  { value: 'CHF', label: 'Swiss Franc',      icon: '🇨🇭', description: 'Switzerland' },
];

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' };
  if (pw.length < 6) return { level: 1, label: 'Weak',   color: 'bg-rose-500' };
  if (pw.length < 10 && !/[^a-zA-Z0-9]/.test(pw)) return { level: 2, label: 'Medium', color: 'bg-yellow-400' };
  if (pw.length >= 10 && /[^a-zA-Z0-9]/.test(pw) && /[0-9]/.test(pw)) return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
  return { level: 2, label: 'Medium', color: 'bg-yellow-400' };
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative w-11 h-6 rounded-full border transition-colors duration-200 focus:outline-none',
        enabled ? 'bg-foreground border-foreground' : 'bg-zinc-800 border-border',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn('absolute top-0.5 w-5 h-5 rounded-full', enabled ? 'bg-background' : 'bg-zinc-500')}
        style={{ left: enabled ? 'calc(100% - 22px)' : '2px' }}
      />
    </button>
  );
}

// ─── Theme Accent Slider ──────────────────────────────────────────────────────

function AccentSlider({ value, onChange }) {
  const idx      = ACCENTS.findIndex((a) => a.id === value);
  const current  = ACCENTS[idx] ?? ACCENTS[0];
  const trackRef = useRef(null);

  const handleTrackClick = (e) => {
    const rect  = trackRef.current.getBoundingClientRect();
    const pct   = (e.clientX - rect.left) / rect.width;
    const i     = Math.round(pct * (ACCENTS.length - 1));
    onChange(ACCENTS[Math.max(0, Math.min(ACCENTS.length - 1, i))].id);
  };

  const thumbPct = (idx / (ACCENTS.length - 1)) * 100;

  return (
    <div className="space-y-3">
      {/* Colour dots */}
      <div className="flex items-center justify-between">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            title={a.label}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-all duration-150',
              value === a.id ? 'scale-125 border-foreground shadow-lg' : 'border-transparent hover:scale-110',
            )}
            style={{ background: a.hex }}
          />
        ))}
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-2 rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${ACCENTS.map((a) => a.hex).join(', ')})`,
        }}
      >
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-background shadow-lg cursor-grab active:cursor-grabbing"
          style={{ left: `${thumbPct}%`, background: current.hex, x: '-50%' }}
          animate={{ left: `${thumbPct}%` }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: current.hex }} />
        <span className="text-xs text-muted-foreground">{current.label}</span>
      </div>
    </div>
  );
}

// ─── Pretty Combobox ──────────────────────────────────────────────────────────

function Combobox({ value, onChange, options }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.value.toLowerCase().includes(search.toLowerCase()),
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(''); }}
        className={cn(
          'w-full flex items-center justify-between gap-3',
          'bg-background border border-border rounded-xl px-4 py-3',
          'text-sm text-foreground transition-colors duration-150',
          'hover:border-foreground/30 focus:outline-none',
          open && 'border-foreground/40',
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{selected?.flag}</span>
          <span className="font-medium">{selected?.value}</span>
          <span className="text-muted-foreground text-xs">{selected?.label}</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -8, scale: 0.97  }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 top-full mt-2 w-full',
              'bg-card border border-border rounded-xl shadow-2xl shadow-black/30',
              'overflow-hidden',
            )}
          >
            {/* Search */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No results</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100',
                      'hover:bg-foreground/5 text-left',
                      value === opt.value && 'bg-foreground/8',
                    )}
                  >
                    <span className="text-base leading-none">{opt.flag}</span>
                    <span className="font-medium text-foreground">{opt.value}</span>
                    <span className="text-muted-foreground text-xs flex-1">{opt.label}</span>
                    {value === opt.value && <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}
    >
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</h2>
      <Card className="card-premium space-y-5">{children}</Card>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
  const [name,     setName]     = useState('Ali Hamza');
  const [nameErr,  setNameErr]  = useState('');
  const email = 'ali@example.com';

  const [copied,   setCopied]   = useState(false);
  const copyTimer = useRef(null);

  const [currency, setCurrency] = useState('USD');
  const [accent,   setAccent]   = useState('zinc');

  const [notifs, setNotifs] = useState({
    priceAlerts:     true,
    weeklyDigest:    false,
    securityUpdates: true,
  });

  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [pwErr,    setPwErr]    = useState('');
  const strength = getStrength(password);

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleNameBlur = () => {
    setNameErr(name.trim().length < 2 ? 'Name must be at least 2 characters.' : '');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('sk_live_abcdefghijklmnop').catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handlePwBlur = () => {
    setPwErr(password && password.length < 8 ? 'Password must be at least 8 characters.' : '');
  };

  const handleSave = () => {
    if (nameErr || pwErr) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 600);
  };

  const initials = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </motion.div>

        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden" animate="visible"
          className="space-y-6"
        >

          {/* ── Profile ─────────────────────────────────────────────── */}
          <Section title="Profile">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-foreground/10 border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-foreground tracking-tight">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Avatar</p>
                <p className="text-xs text-muted-foreground">Initials generated from your display name.</p>
              </div>
            </div>

            <Field label="Display Name">
              <input
                type="text" value={name}
                onChange={(e) => { setName(e.target.value); setNameErr(''); }}
                onBlur={handleNameBlur}
                className={cn(
                  'w-full bg-background border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none transition-colors',
                  nameErr ? 'border-rose-500' : 'border-border',
                )}
              />
              <AnimatePresence>
                {nameErr && (
                  <motion.p key="nerr" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-rose-400">{nameErr}</motion.p>
                )}
              </AnimatePresence>
            </Field>

            <Field label="Email">
              <input type="email" value={email} readOnly
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
              />
            </Field>
          </Section>

          {/* ── API Key ──────────────────────────────────────────────── */}
          <Section title="API Access">
            <Field label="API Key">
              <div className="relative">
                <input type="text" value="sk_live_••••••••••••••••" readOnly
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 pr-24 text-sm font-mono text-muted-foreground focus:outline-none cursor-not-allowed"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span key="copied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2">
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </motion.span>
                    ) : (
                      <motion.button key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-foreground/8">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Field>
          </Section>

          {/* ── Appearance ───────────────────────────────────────────── */}
          <Section title="Appearance">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Accent Colour</label>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: ACCENTS.find(a => a.id === accent)?.hex }} />
                  <span className="text-xs text-muted-foreground">{ACCENTS.find(a => a.id === accent)?.label}</span>
                </div>
              </div>
              {/* Colour dots */}
              <div className="flex items-center justify-between">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.id)}
                    title={a.label}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all duration-150',
                      accent === a.id ? 'scale-125 border-foreground shadow-lg' : 'border-transparent hover:scale-110',
                    )}
                    style={{ background: a.hex }}
                  />
                ))}
              </div>
              {/* Rainbow slider */}
              <div className="relative h-8 flex items-center">
                <div
                  className="absolute inset-x-0 h-2 rounded-full"
                  style={{ background: `linear-gradient(to right, ${ACCENTS.map(a => a.hex).join(', ')})` }}
                />
                <Slider
                  value={ACCENTS.findIndex(a => a.id === accent)}
                  onChange={(i) => setAccent(ACCENTS[i].id)}
                  min={0}
                  max={ACCENTS.length - 1}
                  step={1}
                  showValue={false}
                  className="w-full [&>div:first-child]:hidden"
                />
              </div>
            </div>
          </Section>

          {/* ── Preferences ──────────────────────────────────────────── */}
          <Section title="Preferences">
            <Field label="Currency">
              <Combobox
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES}
                placeholder="Select currency…"
              />
            </Field>
          </Section>

          {/* ── Notifications ────────────────────────────────────────── */}
          <Section title="Notifications">
            {[
              { key: 'priceAlerts',     label: 'Price Alerts',     desc: 'Get notified when assets hit your target price.' },
              { key: 'weeklyDigest',    label: 'Weekly Digest',    desc: 'A summary of your portfolio performance every Monday.' },
              { key: 'securityUpdates', label: 'Security Updates', desc: 'Important alerts about your account security.' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <Toggle enabled={notifs[key]} onToggle={() => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))} />
              </div>
            ))}
          </Section>

          {/* ── Security ─────────────────────────────────────────────── */}
          <Section title="Security">
            <Field label="New Password">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwErr(''); }}
                  onBlur={handlePwBlur}
                  className={cn(
                    'w-full bg-background border rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none transition-colors',
                    pwErr ? 'border-rose-500' : 'border-border',
                  )}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', strength.level >= lvl ? strength.color : '')}
                          animate={{ width: strength.level >= lvl ? '100%' : '0%' }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className={cn('text-xs font-medium',
                    strength.level === 1 ? 'text-rose-400' :
                    strength.level === 2 ? 'text-yellow-400' : 'text-emerald-400'
                  )}>{strength.label}</p>
                </motion.div>
              )}

              <AnimatePresence>
                {pwErr && (
                  <motion.p key="pwerr" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-rose-400">{pwErr}</motion.p>
                )}
              </AnimatePresence>
            </Field>
          </Section>

          {/* ── Save ─────────────────────────────────────────────────── */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}
            className="flex justify-end"
          >
            <motion.div
              animate={saved ? { scale: [1, 0.98, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-36">
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span key="ok" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Saved!
                    </motion.span>
                  ) : saving ? (
                    <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Saving…</motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Save Changes</motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
