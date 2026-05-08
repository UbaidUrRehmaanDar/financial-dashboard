import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Search, Briefcase, BookMarked,
  LineChart, Settings, LogOut, Sun, Moon,
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

const MOBILE_NAV = [
  { hash: 'market',    label: 'Market',    icon: BarChart3  },
  { hash: 'portfolio', label: 'Portfolio', icon: Briefcase  },
  { hash: 'watchlist', label: 'Watchlist', icon: BookMarked },
  { hash: 'charts',    label: 'Charts',    icon: LineChart  },
];

const PAGE_TITLES = {
  market:    'Market Overview',
  stock:     'Stock Detail',
  portfolio: 'Portfolio',
  watchlist: 'Watchlist',
  charts:    'Charts & Analytics',
  settings:  'Settings',
};

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({ item, active }) {
  const Icon = item.icon;
  return (
    <a
      href={`#${item.hash}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'transition-all duration-200 group',
        'hover:-translate-x-0.5',
        active
          ? 'bg-white/10 text-white'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
      )}
    >
      <Icon className={cn(
        'w-4 h-4 flex-shrink-0 transition-colors',
        active ? 'text-white' : 'text-zinc-500 group-hover:text-white',
      )} />
      <span className="text-sm font-medium">{item.label}</span>
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </a>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center',
        'text-zinc-400 hover:text-white hover:bg-zinc-800',
        'active:scale-[0.97] transition-all duration-150',
      )}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />}
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
    window.location.hash = '';
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const pageTitle = PAGE_TITLES[page] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-border z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">MarketIQ</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.hash} item={item} active={page === item.hash} />
          ))}
        </nav>

        {/* User + sign out */}
        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <span className="text-xs text-zinc-400 truncate flex-1">{user?.email ?? 'Guest'}</span>
          </div>
          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'text-zinc-400 hover:bg-zinc-800 hover:text-white',
              'active:scale-[0.97] transition-all duration-150',
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold tracking-tight">{pageTitle}</h2>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {/* Avatar */}
            <a
              href="#settings"
              className={cn(
                'w-8 h-8 rounded-full bg-white/10 border border-white/20',
                'flex items-center justify-center',
                'hover:bg-white/20 active:scale-[0.97] transition-all duration-150',
              )}
            >
              <span className="text-xs font-bold text-white">{initials}</span>
            </a>
          </div>
        </header>

        {/* Page content with transition */}
        <main className="flex-1 pb-20 md:pb-0">
          <PageTransition pageKey={page}>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-border flex">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.hash;
          return (
            <a
              key={item.hash}
              href={`#${item.hash}`}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1',
                'active:scale-[0.97] transition-all duration-150',
                active ? 'text-white' : 'text-zinc-500',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

    </div>
  );
}
