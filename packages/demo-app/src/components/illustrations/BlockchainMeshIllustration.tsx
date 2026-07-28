"use client";

import { motion, useReducedMotion } from "framer-motion";

const chainNodes = [
  { x: 60, y: 140 },
  { x: 160, y: 100 },
  { x: 260, y: 140 },
  { x: 360, y: 100 },
  { x: 460, y: 140 },
];

type BlockchainMeshIllustrationProps = {
  className?: string;
};

export function BlockchainMeshIllustration({ className }: BlockchainMeshIllustrationProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 520 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="chain-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

      {chainNodes.slice(0, -1).map((node, i) => (
        <line
          key={i}
          stroke="#27272a"
          strokeWidth="1.5"
          x1={node.x + 20}
          x2={chainNodes[i + 1].x - 20}
          y1={node.y}
          y2={chainNodes[i + 1].y}
        />
      ))}

      <motion.path
        animate={reduce ? undefined : { strokeDashoffset: [0, -200] }}
        d={`M ${chainNodes[0].x + 20} ${chainNodes[0].y} ${chainNodes
          .slice(1)
          .map((n) => `L ${n.x - 20} ${n.y}`)
          .join(" ")}`}
        fill="none"
        stroke="url(#chain-line)"
        strokeDasharray="40 160"
        strokeWidth="2"
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {chainNodes.map((node, i) => (
        <g key={i}>
          <rect
            fill="#18181b"
            height="40"
            rx="8"
            stroke="#34d399"
            strokeOpacity={i === 2 ? 0.6 : 0.25}
            strokeWidth="1"
            width="40"
            x={node.x - 20}
            y={node.y - 20}
          />
          <text fill="#71717a" fontFamily="monospace" fontSize="8" textAnchor="middle" x={node.x} y={node.y + 4}>
            {i + 1}
          </text>
        </g>
      ))}

      <text fill="#71717a" fontFamily="monospace" fontSize="10" x="24" y="220">
        sepolia · on-chain verification
      </text>
    </svg>
  );
}
