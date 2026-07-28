"use client";

import { motion, useReducedMotion } from "framer-motion";

type ZkProofIllustrationProps = {
  className?: string;
};

export function ZkProofIllustration({ className }: ZkProofIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 400 280"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="zk-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Private witness (hidden) */}
      <rect
        fill="#18181b"
        height="100"
        rx="12"
        stroke="#3f3f46"
        strokeDasharray="4 4"
        strokeWidth="1"
        width="140"
        x="30"
        y="90"
      />
      <text fill="#71717a" fontFamily="monospace" fontSize="10" x="48" y="148">
        private witness
      </text>

      {/* Proof generation arrow */}
      <motion.path
        animate={reduce ? undefined : { strokeDashoffset: [0, -20] }}
        d="M 180 140 H 220"
        stroke="#34d399"
        strokeDasharray="6 4"
        strokeWidth="1.5"
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Proof ring */}
      <motion.circle
        animate={reduce ? undefined : { rotate: 360 }}
        cx="290"
        cy="140"
        fill="none"
        r="52"
        stroke="url(#zk-ring)"
        strokeDasharray="8 6"
        strokeWidth="2"
        style={{ transformOrigin: "290px 140px" }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="290" cy="140" fill="#10b981" fillOpacity="0.15" r="36" stroke="#34d399" strokeOpacity="0.4" />
      <text fill="#34d399" fontFamily="monospace" fontSize="11" textAnchor="middle" x="290" y="144">
        π
      </text>

      {/* Public inputs */}
      <rect fill="#18181b" height="60" rx="8" stroke="#34d399" strokeOpacity="0.3" strokeWidth="1" width="120" x="230" y="210" />
      <text fill="#a1a1aa" fontFamily="monospace" fontSize="9" x="245" y="232">
        public inputs
      </text>
      <text fill="#71717a" fontFamily="monospace" fontSize="8" x="245" y="250">
        liquidity · concentration
      </text>

      <text fill="#71717a" fontFamily="monospace" fontSize="10" x="30" y="260">
        zero-knowledge proof flow
      </text>
    </svg>
  );
}
