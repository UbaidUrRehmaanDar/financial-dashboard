import React from 'react';

/**
 * LogoMark — bold circular fintech mark.
 *
 * Design: A filled circle with a clean geometric pulse/arrow mark inside.
 * Inspired by modern fintech brands — bold, circular, scalable.
 * Uses `currentColor` so it adapts to dark/light theme automatically.
 */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Solid filled circle background */}
      <circle cx="22" cy="22" r="22" fill="currentColor" fillOpacity="0.12" />
      <circle cx="22" cy="22" r="21.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />

      {/* Bold upward arrow / pulse mark */}
      {/* Left leg going up */}
      <path
        d="M10 30 L16 20 L22 26 L28 14 L34 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity="0.9"
      />

      {/* Arrow head at the top right */}
      <path
        d="M28 14 L34 14 L34 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity="0.9"
      />

      {/* Baseline */}
      <line
        x1="10" y1="33"
        x2="34" y2="33"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * LogoFull — circular mark + wordmark side by side.
 */
export function LogoFull({ size = 36, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight text-foreground select-none"
        style={{ fontSize: size * 0.48, letterSpacing: '-0.03em' }}
      >
        Market<span style={{ opacity: 0.4 }}>IQ</span>
      </span>
    </div>
  );
}

export default LogoMark;
