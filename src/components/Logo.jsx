import React from 'react';

/**
 * LogoMark — circular fintech logo with an upward trending line chart inside.
 * Uses a filled circle background with a clean SVG chart mark.
 */
export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="20" cy="20" r="20" fill="currentColor" fillOpacity="0.15" />
      <circle cx="20" cy="20" r="19.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />

      {/* Inner glow ring */}
      <circle cx="20" cy="20" r="15" fill="currentColor" fillOpacity="0.08" />

      {/* Trending line chart — upward path */}
      <polyline
        points="9,28 14,22 18,25 23,16 27,19 31,11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />

      {/* Dot at the tip (latest price) */}
      <circle cx="31" cy="11" r="2.2" fill="currentColor" fillOpacity="0.95" />

      {/* Subtle baseline */}
      <line
        x1="9" y1="30"
        x2="31" y2="30"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full logo — circular mark + wordmark */
export function LogoFull({ size = 32, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-bold tracking-tight text-foreground select-none"
        style={{ fontSize: size * 0.5, letterSpacing: '-0.025em' }}
      >
        Market<span style={{ opacity: 0.45 }}>IQ</span>
      </span>
    </div>
  );
}

export default LogoMark;
