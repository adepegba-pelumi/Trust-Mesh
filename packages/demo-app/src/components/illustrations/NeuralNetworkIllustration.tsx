"use client";

import { motion, useReducedMotion } from "framer-motion";

const nodes = [
  { cx: 120, cy: 80, r: 6 },
  { cx: 280, cy: 60, r: 8 },
  { cx: 420, cy: 100, r: 5 },
  { cx: 200, cy: 180, r: 7 },
  { cx: 360, cy: 200, r: 6 },
  { cx: 480, cy: 160, r: 5 },
  { cx: 80, cy: 220, r: 4 },
  { cx: 300, cy: 280, r: 7 },
];

const edges: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 4], [3, 6], [4, 5], [4, 7], [6, 7],
];

type NeuralNetworkIllustrationProps = {
  className?: string;
};

export function NeuralNetworkIllustration({ className }: NeuralNetworkIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 560 320"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nn-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="nn-node" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      <rect fill="url(#nn-glow)" height="320" rx="24" width="560" />

      {edges.map(([a, b], i) => (
        <motion.line
          key={`${a}-${b}`}
          animate={reduce ? undefined : { opacity: [0.15, 0.45, 0.15] }}
          stroke="#34d399"
          strokeOpacity="0.25"
          strokeWidth="1"
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.15 }}
          x1={nodes[a].cx}
          x2={nodes[b].cx}
          y1={nodes[a].cy}
          y2={nodes[b].cy}
        />
      ))}

      {nodes.map((node, i) => (
        <motion.circle
          key={i}
          animate={reduce ? undefined : { r: [node.r, node.r + 2, node.r] }}
          cx={node.cx}
          cy={node.cy}
          fill="url(#nn-node)"
          r={node.r}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <text fill="#71717a" fontFamily="monospace" fontSize="10" x="24" y="300">
        model · inference graph
      </text>
    </svg>
  );
}
