import React from 'react';

/**
 * Exact Medical Cross with Heart Center SVG Brand Logo for LifeCare Hospital
 */
export const HospitalBrandLogo = ({ size = 38, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', flexShrink: 0, ...style }}
  >
    <defs>
      <linearGradient id="crossGradientShared" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0E9FAD" />
        <stop offset="100%" stopColor="#15966B" />
      </linearGradient>
      <filter id="softGlowShared" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#15966B" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Rounded Cross Arms */}
    <rect x="34" y="6" width="32" height="88" rx="14" fill="url(#crossGradientShared)" filter="url(#softGlowShared)" />
    <rect x="6" y="34" width="88" height="32" rx="14" fill="url(#crossGradientShared)" filter="url(#softGlowShared)" />
    {/* Center Heart Cutout */}
    <path
      d="M50 63C50 63 36 53 36 44C36 39.5 39.5 36 44 36C46.8 36 48.8 37.6 50 39.2C51.2 37.6 53.2 36 56 36C60.5 36 64 39.5 64 44C64 53 50 63 50 63Z"
      fill="#FFFFFF"
    />
  </svg>
);

export default HospitalBrandLogo;
