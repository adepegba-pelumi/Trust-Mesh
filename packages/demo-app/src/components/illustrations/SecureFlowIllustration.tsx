"use client";

import { motion, useReducedMotion } from "framer-motion";

type SecureFlowIllustrationProps = {
  className?: string;
};

export function SecureFlowIllustration({ className }: SecureFlowIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 360 320"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="flow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Agent */}
      <rect fill="#18181b" height="56" rx="10" stroke="#3f3f46" strokeWidth="1" width="100" x="130" y="24" />
      <text fill="#a1a1aa" fontFamily="monospace" fontSize="10" textAnchor="middle" x="180" y="56">
        AI agent
      </text>

      {/* Encrypted channel */}
      <motion.path
        animate={reduce ? undefined : { strokeDashoffset: [0, -24] }}
        d="M 180 80 V 120"
        stroke="#34d399"
        strokeDasharray="4 4"
        strokeWidth="1.5"
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />

      {/* Prover */}
      <rect fill="#18181b" height="56" rx="10" stroke="#34d399" strokeOpacity="0.4" strokeWidth="1" width="120" x="120" y="120" />
      <text fill="#34d399" fontFamily="monospace" fontSize="10" textAnchor="middle" x="180" y="152">
        prover-core
      </text>

      <motion.path
        animate={reduce ? undefined : { strokeDashoffset: [0, -24] }}
        d="M 180 176 V 216"
        stroke="#34d399"
        strokeDasharray="4 4"
        strokeWidth="1.5"
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.3 }}
      />

      {/* Verifier */}
      <rect fill="#18181b" height="56" rx="10" stroke="#34d399" strokeOpacity="0.6" strokeWidth="1.5" width="140" x="110" y="216" />
      <text fill="#a1a1aa" fontFamily="monospace" fontSize="10" textAnchor="middle" x="180" y="248">
        TrustMeshVerifier
      </text>

      {/* Shield glow */}
      <motion.ellipse
        animate={reduce ? undefined : { opacity: [0.2, 0.5, 0.2] }}
        cx="180"
        cy="244"
        fill="url(#flow-grad)"
        rx="80"
        ry="30"
        transition={{ duration: 3, repeat: Infinity }}
      />

      <text fill="#71717a" fontFamily="monospace" fontSize="10" textAnchor="middle" x="180" y="300">
        secure data flow
      </text>
    </svg>
  );
}
