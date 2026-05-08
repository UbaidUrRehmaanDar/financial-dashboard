import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Search, Briefcase, BookMarked,
  LineChart, Settings, Sun, Moon, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/util';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import PageTransition from '@/components/PageTransition';

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { hash: 'market',    label: 'Market',    icon: BarChart3  },
  { hash: 'stock',     label: 'Stocks',    icon: Search     },
  { hash: 'portfolio', label: 'Portfolio', icon: Briefcase  },
  { hash: 'watchlist', label: 'Watchlist', icon: BookMarked },
  { hash: 'charts',    label: 'Charts',    icon: LineChart  },
  { hash: 'settings',  label: 'Settings',  icon: Settings   },
];

const PAGE_TITLES = {
  market:    'Market Overview',
  stock:     'Stock Detail',
  portfolio: 'Portfolio',
  watchlist: 'Watchlist',
  charts:    'Charts & Analytics',
  settings:  'Settings',
};

// ─── Floating Nav Item ────────────────────────────────────────────────────────

function NavItem({ item, active }) {
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={`#${item.hash}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative flex items-center justify-center gap-2 cursor-pointer select-none',
        'rounded-2xl transition-colors duration-200',
        active
          ? 'bg-white/20 text-white shadow-lg'
          : 'text-white/60 hover:text-white',
      )}
      style={{ padding: '10px 14px' }}
    >
      {/* Glassmorphic hover background */}
      <AnimatePresence>
        {(hovered || active) && (
          <motion.span
            key="bg"
            layoutId={active ? `active-${item.hash}` : undefined}
            className={cn(
              'absolute inset-0 rounded-2xl',
              active
                ? 'bg-white/15 backdrop-blur-md border border-white/20'
                : 'bg-white/8 backdrop-blur-sm border border-white/10',
            )}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Icon — always visible */}
      <motion.span layout className="relative z-10 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </motion.span>

      {/* Label — slides in on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 2 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 text-xs font-semibold whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active dot */}
      {active && (
        <motion.span
          layoutId="activeDot"
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </motion.a>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function DashboardShell({ children, page }) {
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.hash = '';
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
  const pageTitle = PAGE_TITLES[page] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Topbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">{pageTitle}</h2>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card active:scale-[0.97] transition-all duration-150"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card active:scale-[0.97] transition-all duration-150"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <a
            href="#settings"
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 active:scale-[0.97] transition-all duration-150"
          >
            <span className="text-xs font-bold text-white">{initials}</span>
          </a>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────── */}
      <main className="pb-32">
        <PageTransition pageKey={page}>
          {children}
        </PageTransition>
      </main>

      {/* ── Floating Bottom Nav ──────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.nav
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-3xl',
            'bg-zinc-900/70 backdrop-blur-xl',
            'border border-white/10',
            'shadow-2xl shadow-black/40',
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(39,39,42,0.85) 0%, rgba(24,24,27,0.90) 100%)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.hash} item={item} active={page === item.hash} />
          ))}
        </motion.nav>
      </div>

    </div>
  );
}
