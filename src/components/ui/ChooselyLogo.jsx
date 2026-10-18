import React from 'react';

/**
 * Choosely Brand Logo
 * A minimal geometric mark depicting three branching option paths
 * converging into one clear selected focal point.
 */
export function ChooselyLogo({
  size = 32,
  className = '',
  decorative = false,
  label = 'Choosely logo',
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      className={`shrink-0 select-none ${className}`}
    >
      {!decorative && <title>{label}</title>}
      {/* Rounded geometric badge in restrained forest-green accent */}
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-primary-container transition-colors"
      />
      {/* Upper and lower secondary option branches converging toward the focal point */}
      <path
        d="M9 9.5C14 9.5 15.5 16 21.5 16M9 22.5C14 22.5 15.5 16 21.5 16"
        stroke="#A6F2D1"
        strokeOpacity="0.68"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Primary selected path */}
      <path
        d="M7.5 16H21.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Origin option nodes */}
      <circle cx="9" cy="9.5" r="1.6" fill="#A6F2D1" fillOpacity="0.85" />
      <circle cx="9" cy="22.5" r="1.6" fill="#A6F2D1" fillOpacity="0.85" />
      <circle cx="7.5" cy="16" r="1.75" fill="#FFFFFF" />
      {/* Resolved choice focal node */}
      <circle cx="23" cy="16" r="3" fill="#FFFFFF" />
      <circle
        cx="23"
        cy="16"
        r="1.25"
        className="fill-primary-container transition-colors"
      />
    </svg>
  );
}

export default ChooselyLogo;
