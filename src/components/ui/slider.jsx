/**
 * Slider — reusable range slider component.
 *
 * Props:
 *   value       number          current value
 *   onChange    (n: number) => void
 *   min         number          default 0
 *   max         number          default 100
 *   step        number          default 1
 *   label       string          optional label above
 *   showValue   boolean         show current value badge (default true)
 *   formatValue (n) => string   custom value formatter
 *   className   string
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/util';

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue = (n) => String(n),
  className = '',
}) {
  const trackRef = useRef(null);

  const pct = ((value - min) / (max - min)) * 100;

  const handleTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const raw  = ((e.clientX - rect.left) / rect.width) * (max - min) + min;
    const snapped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, snapped)));
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      onChange(Math.min(max, value + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      onChange(Math.max(min, value - step));
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono tabular-nums text-muted-foreground bg-card border border-border rounded-md px-2 py-0.5">
              {formatValue(value)}
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={handleKey}
        onClick={handleTrackClick}
        className="relative h-2 rounded-full bg-border cursor-pointer focus:outline-none group"
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-foreground transition-all duration-150"
          style={{ width: `${pct}%` }}
        />

        {/* Thumb */}
        <motion.div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
            'w-5 h-5 rounded-full bg-foreground border-2 border-background',
            'shadow-md cursor-grab active:cursor-grabbing',
            'transition-shadow duration-150 group-hover:shadow-lg',
          )}
          style={{ left: `${pct}%` }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">{formatValue(min)}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{formatValue(max)}</span>
      </div>
    </div>
  );
}

export default Slider;
