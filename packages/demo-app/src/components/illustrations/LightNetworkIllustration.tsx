"use client";

import { motion, useReducedMotion } from "framer-motion";

type LightNetworkIllustrationProps = {
  className?: string;
};

const nodes = [
  { x: 70, y: 160, r: 10 },
  { x: 140, y: 90, r: 9 },
  { x: 210, y: 170, r: 8 },
  { x: 280, y: 70, r: 14, accent: true },
  { x: 350, y: 150, r: 9 },
  { x: 420, y: 100, r: 10 },
  { x: 480, y: 180, r: 8 },
  { x: 180, y: 40, r: 7 },
  { x: 380, y: 40, r: 8 },
];

const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [1, 7],
  [3, 8],
  [7, 8],
  [0, 2],
  [4, 5],
];

export function LightNetworkIllustration({ className }: LightNetworkIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 560 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2FAE6E" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2FAE6E" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect fill="#FDFCF9" height="240" rx="16" width="560" />

      {edges.map(([a, b], i) => (
        <line
          key={i}
          stroke="#D8D5CC"
          strokeWidth="1.25"
          x1={nodes[a].x}
          x2={nodes[b].x}
          y1={nodes[a].y}
          y2={nodes[b].y}
        />
      ))}

      {!reduce ? (
        <motion.circle
          animate={{ r: [28, 42, 28], opacity: [0.35, 0.15, 0.35] }}
          cx={nodes[3].x}
          cy={nodes[3].y}
          fill="url(#node-glow)"
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <circle cx={nodes[3].x} cy={nodes[3].y} fill="url(#node-glow)" r={36} />
      )}

      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          fill={node.accent ? "#2FAE6E" : "#E8F5EE"}
          r={node.r}
          stroke={node.accent ? "#2FAE6E" : "#C8E6D4"}
          strokeWidth="1.5"
        />
      ))}

      <text
        fill="#6B6B66"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontSize="11"
        fontWeight="500"
        x="24"
        y="220"
      >
        verified agent network
      </text>
    </svg>
  );
}
