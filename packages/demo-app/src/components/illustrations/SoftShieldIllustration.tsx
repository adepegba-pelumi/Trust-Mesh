"use client";

import { motion, useReducedMotion } from "framer-motion";

type SoftShieldIllustrationProps = {
  className?: string;
};

export function SoftShieldIllustration({ className }: SoftShieldIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 720 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shield-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8F5EE" />
          <stop offset="55%" stopColor="#FDFCF9" />
          <stop offset="100%" stopColor="#F3F0E6" />
        </linearGradient>
        <linearGradient id="shield-fill" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8F5EE" />
        </linearGradient>
      </defs>

      <rect fill="url(#shield-bg)" height="400" rx="24" width="720" />

      <circle cx="120" cy="90" fill="#2FAE6E" fillOpacity="0.08" r="70" />
      <circle cx="600" cy="310" fill="#2FAE6E" fillOpacity="0.1" r="90" />
      <circle cx="560" cy="80" fill="#F0EBE0" fillOpacity="0.9" r="50" />

      {!reduce ? (
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M360 78c-54 18-108 20-148 18v118c0 74 58 128 148 156 90-28 148-82 148-156V96c-40 2-94 0-148-18Z"
            fill="url(#shield-fill)"
            stroke="#2FAE6E"
            strokeOpacity="0.35"
            strokeWidth="2.5"
          />
          <path
            d="M318 198l28 28 56-64"
            stroke="#2FAE6E"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
          />
        </motion.g>
      ) : (
        <g>
          <path
            d="M360 78c-54 18-108 20-148 18v118c0 74 58 128 148 156 90-28 148-82 148-156V96c-40 2-94 0-148-18Z"
            fill="url(#shield-fill)"
            stroke="#2FAE6E"
            strokeOpacity="0.35"
            strokeWidth="2.5"
          />
          <path
            d="M318 198l28 28 56-64"
            stroke="#2FAE6E"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
          />
        </g>
      )}

      <text
        fill="#6B6B66"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontSize="12"
        fontWeight="500"
        textAnchor="middle"
        x="360"
        y="372"
      >
        cryptographic verification without exposure
      </text>
    </svg>
  );
}
