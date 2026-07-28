"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cpu, GitCommitVertical, ShieldCheck, Sigma } from "lucide-react";

const nodes = [
  { icon: Cpu, label: "model", hash: "w_θ · quantized" },
  { icon: GitCommitVertical, label: "commit", hash: "KZG · Ethereum SRS" },
  { icon: Sigma, label: "prove", hash: "Halo2 · MLP circuit" },
  { icon: ShieldCheck, label: "verify", hash: "Sepolia · on-chain" },
];

function useTickingHash(seed: number) {
  const [hex, setHex] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const chars = "0123456789abcdef";
    const id = setInterval(() => {
      let h = "0x";
      for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * 16)];
      setHex(h);
    }, 900 + seed * 130);
    return () => clearInterval(id);
  }, [seed, reduce]);

  return reduce ? "0x········" : hex;
}

function NodeReadout({ index }: { index: number }) {
  const hex = useTickingHash(index);
  return (
    <span className="font-mono text-[10px] tabular-nums text-emerald-500/70">
      {hex || "0x········"}
    </span>
  );
}

export function ProofPipeline() {
  const reduce = useReducedMotion();

  return (
    <div className="relative w-full">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 640 220"
      >
        <defs>
          <linearGradient id="trace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 70 110 H 570" fill="none" stroke="#27272a" strokeWidth="1.5" />
        {!reduce ? (
          <motion.path
            animate={{ strokeDashoffset: -400 }}
            d="M 70 110 H 570"
            fill="none"
            initial={{ strokeDashoffset: 500 }}
            stroke="url(#trace)"
            strokeDasharray="120 400"
            strokeWidth="1.5"
            transition={{ duration: 3.2, ease: "linear", repeat: Infinity }}
          />
        ) : null}
      </svg>

      <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
        {nodes.map((node, i) => (
          <motion.div
            key={node.label}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 text-center"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            transition={{ delay: 0.15 * i, duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              animate={
                reduce
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 0px rgba(52,211,153,0)",
                        "0 0 22px rgba(52,211,153,0.35)",
                        "0 0 0px rgba(52,211,153,0)",
                      ],
                    }
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-zinc-950 text-emerald-400"
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: i * 0.65,
                ease: "easeInOut",
              }}
            >
              <node.icon aria-hidden className="h-5 w-5" />
            </motion.div>
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {node.label}
              </p>
              <NodeReadout index={i} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
