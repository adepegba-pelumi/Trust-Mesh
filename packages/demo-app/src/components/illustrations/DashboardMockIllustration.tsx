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
      <rect fill="#FFFFFF" height="220" rx="16" stroke="#EDEBE4" strokeWidth="1.5" width="380" x="50" y="40" />
      <rect fill="#FDFCF9" height="28" rx="12" width="380" x="50" y="40" />
      <circle cx="70" cy="54" fill="#F5C6C6" r="4" />
      <circle cx="84" cy="54" fill="#F5E0B0" r="4" />
      <circle cx="98" cy="54" fill="#B8E0C8" r="4" />

      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          fill="#E8F5EE"
          height="48"
          rx="10"
          stroke="#EDEBE4"
          strokeWidth="1"
          width="100"
          x={70 + i * 115}
          y="82"
        />
      ))}

      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          fill={i === 2 ? "#E8F5EE" : "#FDFCF9"}
          height="36"
          rx="8"
          stroke={i === 2 ? "#2FAE6E" : "#EDEBE4"}
          strokeOpacity={i === 2 ? 0.55 : 1}
          strokeWidth="1.25"
          width="58"
          x={70 + i * 68}
          y="150"
        />
      ))}

      {[0, 1, 2].map((i) => (
        <rect key={i} fill="#F7F6F1" height="20" rx="6" width="340" x="70" y={205 + i * 26} />
      ))}

      <motion.g
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect
          fill="#FFFFFF"
          height="72"
          rx="12"
          stroke="#2FAE6E"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          width="120"
          x="340"
          y="180"
        />
        <text fill="#2FAE6E" fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="9" x="355" y="205">
          verified ✓
        </text>
        <text fill="#6B6B66" fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="8" x="355" y="225">
          block #8.2M
        </text>
      </motion.g>

      <text
        fill="#6B6B66"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontSize="10"
        x="50"
        y="285"
      >
        live demo dashboard
      </text>
    </svg>
  );
}
