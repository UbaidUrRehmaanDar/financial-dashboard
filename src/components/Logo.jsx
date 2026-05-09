import React from 'react';

// MarketIQ logo mark — stylized upward candlestick / pulse chart
export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background square with rounded corners */}
      <rect width="28" height="28" rx="7" fill="currentColor" fillOpacity="0.12" />
      <rect width="28" height="28" rx="7" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />

      {/* Candlestick bars — 3 bars of varying heights */}
      {/* Bar 1 — short, left */}
      <rect x="5" y="16" width="4" height="7" rx="1.5" fill="currentColor" fillOpacity="0.4" />
      <line x1="7" y1="14" x2="7" y2="16" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />

      {/* Bar 2 — tall, center (highlighted) */}
      <rect x="12" y="9" width="4" height="14" rx="1.5" fill="currentColor" />
      <line x1="14" y1="6" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      {/* Bar 3 — medium, right */}
      <rect x="19" y="13" width="4" height="10" rx="1.5" fill="currentColor" fillOpacity="0.6" />
      <line x1="21" y1="11" x2="21" y2="13" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />

      {/* Upward tick on center bar */}
      <polyline
        points="12,12 14,9 16,11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

// Full logo — mark + wordmark
export function LogoFull({ size = 28, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-bold tracking-tight text-foreground select-none"
        style={{ fontSize: size * 0.57, letterSpacing: '-0.02em' }}
      >
        Market<span style={{ opacity: 0.5 }}>IQ</span>
      </span>
    </div>
  );
}

export default LogoMark;
