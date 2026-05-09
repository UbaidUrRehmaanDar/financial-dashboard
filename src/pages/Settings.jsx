import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Eye, EyeOff, Camera, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/util';
import { supabase } from '@/lib/supabase';

// ─── Currency options ─────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar',         icon: '🇺🇸', description: 'United States' },
  { value: 'EUR', label: 'Euro',              icon: '🇪🇺', description: 'European Union' },
  { value: 'GBP', label: 'British Pound',     icon: '🇬🇧', description: 'United Kingdom' },
  { value: 'PKR', label: 'Pakistani Rupee',   icon: '🇵🇰', description: 'Pakistan' },
  { value: 'JPY', label: 'Japanese Yen',      icon: '🇯🇵', description: 'Japan' },
  { value: 'CAD', label: 'Canadian Dollar',   icon: '🇨🇦', description: 'Canada' },
  { value: 'AUD', label: 'Australian Dollar', icon: '🇦🇺', description: 'Australia' },
  { value: 'CHF', label: 'Swiss Franc',       icon: '🇨🇭', description: 'Switzerland' },
];

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' };
  if (pw.length < 6)  return { level: 1, label: 'Weak',   color: 'bg-rose-500' };
  if (pw.length < 10 && !/[^a-zA-Z0-9]/.test(pw))
    return { level: 2, label: 'Medium', color: 'bg-yellow-400' };
  if (pw.length >= 10 && /[^a-zA-Z0-9]/.test(pw) && /[0-9]/.test(pw))
    return { level: 3, label: 'Strong',  color: 'bg-emerald-500' };
  return { level: 2, label: 'Medium', color: 'bg-yellow-400' };
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full border-2 transition-colors duration-200 focus:outline-none flex-shrink-0',
        enabled ? 'bg-foreground border-foreground' : 'bg-border border-border',
      )}
    >
      <span
        className={cn(
          'inline-block w-4 h-4 rounded-full transition-transform duration-200 ease-in-out mt-0.5',
          enabled ? 'translate-x-5 bg-background' : 'translate-x-0.5 bg-muted',
        )}
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
  // ── Auth user ──────────────────────────────────────────────────────────────
  const [user,       setUser]       = useState(null);
  const [loadingUser,setLoadingUser]= useState(true);

  // ── Profile ────────────────────────────────────────────────────────────────
  const [name,       setName]       = useState('');
  const [nameErr,    setNameErr]    = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  // ── Preferences ────────────────────────────────────────────────────────────
  const [currency,   setCurrency]   = useState('USD');

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    priceAlerts:     true,
    weeklyDigest:    false,
    securityUpdates: true,
  });

  // ── Password ───────────────────────────────────────────────────────────────
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [pwErr,      setPwErr]      = useState('');
  const strength = getStrength(password);

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [saveError,  setSaveError]  = useState('');

  // ── Load real user on mount ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        // Populate from user_metadata if available
        setName(u.user_metadata?.full_name ?? u.user_metadata?.name ?? '');
        setAvatarUrl(u.user_metadata?.avatar_url ?? '');
      }
      setLoadingUser(false);
    });
  }, []);

  // ── Avatar file picker ─────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const handleNameBlur = () => {
    setNameErr(name.trim().length < 2 ? 'Name must be at least 2 characters.' : '');
  };

  const handlePwBlur = () => {
    setPwErr(password && password.length < 8 ? 'Password must be at least 8 characters.' : '');
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (nameErr || pwErr) return;
    setSaving(true);
    setSaveError('');

    try {
      const updates = {};

      // 1. Convert avatar to base64 and store in metadata (no bucket needed)
      if (avatarFile) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload  = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
        updates.avatar_url = base64;
        setAvatarUrl(base64);
        setAvatarFile(null);
        setAvatarPreview('');
      }

      // 2. Display name
      if (name.trim()) updates.full_name = name.trim();

      // 3. Update metadata
      if (Object.keys(updates).length) {
        const { error: metaErr } = await supabase.auth.updateUser({ data: updates });
        if (metaErr) throw new Error('Profile update failed: ' + metaErr.message);
      }

      // 4. Change password if provided
      if (password && password.length >= 8) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw new Error('Password update failed: ' + pwError.message);
        setPassword('');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayName  = name.trim() || user?.email?.split('@')[0] || 'User';
  const initials     = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const displayEmail = user?.email ?? '';
  const currentAvatar = avatarPreview || avatarUrl;

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-border border-t-foreground rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

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
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-foreground/10 border-2 border-border overflow-hidden flex items-center justify-center">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-foreground">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity shadow-md"
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{displayEmail}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 underline underline-offset-2"
                >
                  Change photo
                </button>
              </div>
            </div>

            {/* Display name */}
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

            {/* Email — read only */}
            <Field label="Email Address">
              <input
                type="email"
                value={displayEmail}
                readOnly
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </Field>
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
                  type={showPw ? 'text' : 'password'}
                  value={password}
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
              <p className="text-xs text-muted-foreground">Leave blank to keep your current password.</p>

              {/* Strength meter */}
              {password && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
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
            className="space-y-3"
          >
            <AnimatePresence>
              {saveError && (
                <motion.p key="saveerr" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
                  {saveError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <motion.div animate={saved ? { scale: [1, 0.98, 1.05, 1] } : { scale: 1 }} transition={{ duration: 0.5 }}>
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
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
