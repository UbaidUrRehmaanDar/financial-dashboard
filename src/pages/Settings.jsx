import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/util';

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
        enabled ? 'bg-white border-white' : 'bg-zinc-800 border-border',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full',
          enabled ? 'bg-black' : 'bg-zinc-500',
        )}
        style={{ left: enabled ? 'calc(100% - 22px)' : '2px' }}
      />
    </button>
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

// ─── Field wrapper ────────────────────────────────────────────────────────────

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
  // Profile
  const [name,      setName]      = useState('Ali Hamza');
  const [nameErr,   setNameErr]   = useState('');
  const email = 'ali@example.com';

  // API key
  const [copied,    setCopied]    = useState(false);
  const copyTimer = useRef(null);

  // Currency
  const [currency,  setCurrency]  = useState('USD');

  // Notifications
  const [notifs, setNotifs] = useState({
    priceAlerts:    true,
    weeklyDigest:   false,
    securityUpdates: true,
  });

  // Password
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [pwErr,     setPwErr]     = useState('');
  const strength = getStrength(password);

  // Save state
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────
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
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  };

  // ── Initials ─────────────────────────────────────────────────────────────
  const initials = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </motion.div>

        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >

          {/* ── Profile ─────────────────────────────────────────────── */}
          <Section title="Profile">
            {/* Avatar + name row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white tracking-tight">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Avatar</p>
                <p className="text-xs text-muted-foreground">Initials generated from your display name.</p>
              </div>
            </div>

            <Field label="Display Name">
              <input
                type="text"
                value={name}
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
              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
              />
            </Field>
          </Section>

          {/* ── API Key ──────────────────────────────────────────────── */}
          <Section title="API Access">
            <Field label="API Key">
              <div className="relative">
                <input
                  type="text"
                  value="sk_live_••••••••••••••••"
                  readOnly
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
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-zinc-800">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Field>
          </Section>

          {/* ── Preferences ──────────────────────────────────────────── */}
          <Section title="Preferences">
            <Field label="Currency">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {['USD', 'EUR', 'GBP', 'PKR'].map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">{c}</option>
                ))}
              </select>
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
                <Toggle
                  enabled={notifs[key]}
                  onToggle={() => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))}
                />
              </div>
            ))}
          </Section>

          {/* ── Security ─────────────────────────────────────────────── */}
          <Section title="Security">
            <Field label="New Password">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwErr(''); }}
                  onBlur={handlePwBlur}
                  className={cn(
                    'w-full bg-background border rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none transition-colors',
                    pwErr ? 'border-rose-500' : 'border-border',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength meter */}
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
                  )}>
                    {strength.label}
                  </p>
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

          {/* ── Save button ───────────────────────────────────────────── */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}
            className="flex justify-end"
          >
            <motion.div
              animate={saved ? {
                scale: [1, 0.98, 1.05, 1],
                borderColor: ['transparent', '#10b981', '#10b981', 'transparent'],
              } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg"
            >
              <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-36">
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span key="ok" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Saved!
                    </motion.span>
                  ) : saving ? (
                    <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Saving…
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Save Changes
                    </motion.span>
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
