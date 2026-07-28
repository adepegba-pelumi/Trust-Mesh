"use client";

import { motion, useReducedMotion } from "framer-motion";

type DashboardMockIllustrationProps = {
  className?: string;
};

export function DashboardMockIllustration({ className }: DashboardMockIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 480 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main panel */}
      <rect fill="#09090b" height="220" rx="16" stroke="#27272a" strokeWidth="1" width="380" x="50" y="40" />
      <rect fill="#18181b" height="28" rx="8" width="380" x="50" y="40" />
      <circle cx="70" cy="54" fill="#3f3f46" r="4" />
      <circle cx="84" cy="54" fill="#3f3f46" r="4" />
      <circle cx="98" cy="54" fill="#34d399" fillOpacity="0.5" r="4" />

      {/* Stat cards */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          fill="#18181b"
          height="48"
          rx="8"
          stroke="#27272a"
          strokeWidth="1"
          width="100"
          x={70 + i * 115}
          y="82"
        />
      ))}

      {/* Pipeline stages */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          fill={i === 2 ? "#10b981" : "#18181b"}
          fillOpacity={i === 2 ? 0.15 : 1}
          height="36"
          rx="6"
          stroke={i === 2 ? "#34d399" : "#27272a"}
          strokeOpacity={i === 2 ? 0.5 : 1}
          strokeWidth="1"
          width="58"
          x={70 + i * 68}
          y="150"
        />
      ))}

      {/* Audit table rows */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          fill="#18181b"
          height="20"
          rx="4"
          width="340"
          x="70"
          y={205 + i * 26}
        />
      ))}

      {/* Floating card */}
      <motion.g
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect fill="#18181b" height="72" rx="10" stroke="#34d399" strokeOpacity="0.35" strokeWidth="1" width="120" x="340" y="180" />
        <text fill="#34d399" fontFamily="monospace" fontSize="9" x="355" y="205">
          verified ✓
        </text>
        <text fill="#71717a" fontFamily="monospace" fontSize="8" x="355" y="225">
          block #8.2M
        </text>
      </motion.g>

      <text fill="#71717a" fontFamily="monospace" fontSize="10" x="50" y="285">
        live demo dashboard
      </text>
    </svg>
  );
}
