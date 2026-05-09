import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, TrendingUp, BarChart3, Shield, Zap, Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/util';
import { LogoMark } from '@/components/Logo';
import { useTheme } from '@/hooks/useTheme';

const FEATURES = [
  { icon: BarChart3, label: 'Real-time market data' },
  { icon: TrendingUp, label: 'Portfolio tracking' },
  { icon: Shield,    label: 'Bank-grade security' },
  { icon: Zap,       label: 'AI-powered insights' },
];

export default function Auth() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.hash = 'market';
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess('Account created. Check your email to confirm, then sign in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border relative overflow-hidden bg-zinc-950">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-700/25 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-80 h-80 bg-zinc-600/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <LogoMark size={44} className="text-white" />
          <span className="font-bold text-sm tracking-tight text-white">
            Market<span className="opacity-50">IQ</span>
          </span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tight leading-tight mb-3 text-white">
              Your edge in<br />the market.
            </h2>
            <p className="text-zinc-400 leading-relaxed max-w-sm">
              Track portfolios, analyze sector trends, and get AI-powered insights — all in one clean dashboard.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 bg-white/10 border border-white/15 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-zinc-400">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          © 2024 MarketIQ. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative bg-background">

        {/* Theme toggle — top right */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-all duration-150"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute">
                <Sun className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute">
                <Moon className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <LogoMark size={36} className="text-foreground" />
          <span className="font-bold text-sm tracking-tight">
            Market<span className="opacity-40">IQ</span>
          </span>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard.'
                : 'Fill in the details below to get started.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-foreground/5 border border-border rounded-lg p-1 mb-6">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  'flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                  mode === m
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={cn(
                    'w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5',
                    'text-sm text-foreground',
                    'focus:outline-none transition-colors duration-150',
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={cn(
                    'w-full bg-card border border-border rounded-lg pl-9 pr-10 py-2.5',
                    'text-sm text-foreground',
                    'focus:outline-none transition-colors duration-150',
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
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
              )}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {error && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { window.location.hash = ''; }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
