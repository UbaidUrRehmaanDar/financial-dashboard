import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Briefcase, BookMarked,
  LineChart, Settings, Sun, Moon, LogOut, Bell, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/util';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import PageTransition from '@/components/PageTransition';
import { LogoMark, LogoFull } from '@/components/Logo';

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

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ item, active, theme }) {
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);
  const showLabel = hovered || active;
  const isDark = theme === 'dark';

  return (
    <motion.a
      href={`#${item.hash}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={cn(
        'relative flex items-center gap-0 rounded-2xl cursor-pointer select-none overflow-hidden shrink-0',
        'transition-colors duration-150',
        active
          ? isDark ? 'text-white'       : 'text-zinc-900'
          : isDark ? 'text-white/50 hover:text-white/80' : 'text-zinc-400 hover:text-zinc-700',
      )}
      style={{ padding: '8px 9px' }}
    >
      {/* Glass pill background */}
      <AnimatePresence>
        {showLabel && (
          <motion.span
            key="pill"
            className="absolute inset-0 rounded-2xl"
            style={active
              ? isDark
                ? { background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }
                : { background: 'rgba(0,0,0,0.08)',       border: '1px solid rgba(0,0,0,0.12)' }
              : isDark
                ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }
                : { background: 'rgba(0,0,0,0.05)',       border: '1px solid rgba(0,0,0,0.08)' }
            }
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <span className="relative z-10 flex-shrink-0">
        <Icon className="w-[18px] h-[18px]" />
      </span>

      {/* Label */}
      <motion.span
        layout
        className="relative z-10 text-xs font-semibold whitespace-nowrap overflow-hidden hidden sm:inline"
        animate={{
          width:      showLabel ? 'auto' : 0,
          opacity:    showLabel ? 1 : 0,
          marginLeft: showLabel ? 6 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {item.label}
      </motion.span>

      {/* Active dot */}
      {active && (
        <motion.span
          layoutId="activeDot"
          className={cn(
            'absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
            isDark ? 'bg-white' : 'bg-zinc-900',
          )}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </motion.a>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground tracking-wide">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─── Theme toggle with animated icon swap ─────────────────────────────────────

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card active:scale-[0.93] transition-all duration-150 overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{    rotate:  90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute"
          >
            <Sun className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90,  opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{    rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute"
          >
            <Moon className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
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
    // Reset to dark mode so landing page looks correct
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    localStorage.setItem('theme-preference', 'dark');
    window.location.hash = '';
  };

  const initials  = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
  const pageTitle = PAGE_TITLES[page] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Topbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-3 sm:px-6 h-14 gap-2 sm:gap-4">

          {/* Left — logo + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <LogoMark size={38} className="text-foreground" />
              <span className="text-base font-extrabold tracking-tight hidden sm:block" style={{ letterSpacing: '-0.03em' }}>
                Market<span className="opacity-40">IQ</span>
              </span>
            </div>

            {/* Separator + page title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-border text-lg font-light select-none hidden sm:block">/</span>
              <motion.span
                key={pageTitle}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium text-foreground truncate"
              >
                {pageTitle}
              </motion.span>
            </div>
          </div>

          {/* Center — live clock */}
          <div className="hidden md:flex items-center">
            <LiveClock />
          </div>

          {/* Right — controls */}
          <div className="flex items-center gap-1">

            {/* Theme toggle */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/8 active:scale-[0.93] transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* User pill */}
            <a
              href="#settings"
              className="flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-full border border-border hover:bg-foreground/5 active:scale-[0.97] transition-all duration-150 ml-1"
            >
              <div className="w-6 h-6 rounded-full bg-foreground/15 border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-foreground leading-none">{initials}</span>
              </div>
              <span className="text-xs font-medium text-foreground hidden sm:block max-w-[100px] truncate">
                {user?.email?.split('@')[0] ?? 'Account'}
              </span>
            </a>
          </div>

        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────── */}
      <main className="pb-24 sm:pb-28">
        <PageTransition pageKey={page}>
          {children}
        </PageTransition>
      </main>

      {/* ── Floating Bottom Nav ──────────────────────────────────────── */}
      <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 flex justify-center z-50 pointer-events-none px-2">
        <motion.nav
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-[24px] sm:rounded-[28px] max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={theme === 'dark' ? {
            background: 'linear-gradient(135deg, rgba(30,30,33,0.88) 0%, rgba(18,18,20,0.92) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          } : {
            background: 'linear-gradient(135deg, rgba(244,244,245,0.92) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.hash} item={item} active={page === item.hash} theme={theme} />
          ))}
        </motion.nav>
      </div>

    </div>
  );
}
