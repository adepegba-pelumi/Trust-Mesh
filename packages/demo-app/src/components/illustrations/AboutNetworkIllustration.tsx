"use client";

import { motion, useReducedMotion } from "framer-motion";

type AboutNetworkIllustrationProps = {
  className?: string;
};

/** Quiet line-art ZK network — black/gray edges, green on two nodes only. */
const nodes = [
  { x: 48, y: 118, r: 5 },
  { x: 98, y: 62, r: 4.5 },
  { x: 132, y: 148, r: 4 },
  { x: 178, y: 88, r: 7, accent: true },
  { x: 228, y: 42, r: 4 },
  { x: 248, y: 142, r: 5 },
  { x: 298, y: 78, r: 4.5 },
  { x: 338, y: 128, r: 6.5, accent: true },
  { x: 372, y: 52, r: 4 },
  { x: 402, y: 108, r: 4.5 },
];

const edges: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [5, 7],
  [6, 7],
  [6, 8],
  [7, 9],
  [8, 9],
  [2, 5],
];

export function AboutNetworkIllustration({ className }: AboutNetworkIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 440 190"
      xmlns="http://www.w3.org/2000/svg"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          stroke="#D1D1D6"
          strokeWidth="1"
          x1={nodes[a]!.x}
          x2={nodes[b]!.x}
          y1={nodes[a]!.y}
          y2={nodes[b]!.y}
        />
      ))}

      {nodes.map((node, i) => {
        const accent = Boolean(node.accent);
        return (
          <g key={i}>
            {accent && !reduce ? (
              <motion.circle
                animate={{ r: [node.r + 6, node.r + 12, node.r + 6], opacity: [0.22, 0.08, 0.22] }}
                cx={node.x}
                cy={node.y}
                fill="#22C55E"
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              />
            ) : null}
            <circle
              cx={node.x}
              cy={node.y}
              fill={accent ? "#22C55E" : "#FFFFFF"}
              r={node.r}
              stroke={accent ? "#22C55E" : "#111111"}
              strokeWidth={accent ? 1.5 : 1.25}
            />
          </g>
        );
      })}
    </svg>
  );
}
