/**
 * Combobox — reusable searchable dropdown component.
 *
 * Props:
 *   value       string                    current selected value
 *   onChange    (value: string) => void
 *   options     Array<{
 *                 value: string,
 *                 label: string,
 *                 icon?: string | ReactNode,   emoji or JSX icon
 *                 description?: string         optional sub-label
 *               }>
 *   placeholder string                    trigger placeholder text
 *   searchable  boolean                   show search input (default true)
 *   className   string
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/util';

export function Combobox({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  searchable = true,
  className = '',
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = searchable && search.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          (o.description ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setSearch('');
  };

  const handleToggle = () => {
    setOpen((v) => !v);
    if (open) setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>

      {/* ── Trigger ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between gap-3',
          'bg-background border border-border rounded-xl px-4 py-3',
          'text-sm text-foreground transition-all duration-150',
          'hover:border-foreground/30 focus:outline-none',
          open && 'border-foreground/40 ring-1 ring-foreground/10',
        )}
      >
        {selected ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {selected.icon && (
              <span className="text-base leading-none flex-shrink-0">{selected.icon}</span>
            )}
            <span className="font-medium truncate">{selected.label}</span>
            {selected.description && (
              <span className="text-muted-foreground text-xs truncate hidden sm:block">
                {selected.description}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.span>
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -6, scale: 0.98  }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 top-full mt-2 w-full',
              'bg-card border border-border rounded-xl',
              'shadow-2xl shadow-black/25 overflow-hidden',
            )}
          >
            {/* Search */}
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(
                      'w-full bg-background border border-border rounded-lg',
                      'pl-8 pr-3 py-2 text-xs text-foreground',
                      'focus:outline-none transition-colors duration-150',
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-5">No results found</p>
              ) : (
                filtered.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.1 }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left',
                        'transition-colors duration-100',
                        isSelected
                          ? 'bg-foreground/8 text-foreground'
                          : 'text-foreground hover:bg-foreground/5',
                      )}
                    >
                      {opt.icon && (
                        <span className="text-base leading-none flex-shrink-0">{opt.icon}</span>
                      )}
                      <span className="font-medium flex-1 truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-muted-foreground text-xs truncate hidden sm:block">
                          {opt.description}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Combobox;
