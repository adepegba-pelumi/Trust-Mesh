"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    title: "Register the model",
    body: "Quantized weights are committed with the Ethereum ceremony SRS and bound to the agent on-chain.",
  },
  {
    title: "Run inference",
    body: "The agent observes market data and produces a decision using the committed model.",
  },
  {
    title: "Generate the proof",
    body: "The Rust prover-core crate builds a Halo2 witness and proof over a fixed-topology circuit.",
  },
  {
    title: "Submit on Sepolia",
    body: "verifyAndExecute checks the proof against the registered commitment before anything runs.",
  },
  {
    title: "Execute, within limits",
    body: "Only allowlisted calls pass, gated by liquidity, concentration, and velocity rules.",
  },
  {
    title: "Stream the audit trail",
    body: "A VerifiedDecision event is emitted and pushed to your dashboard or LangChain pipeline live.",
  },
];

export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="border-t border-zinc-900 bg-zinc-950/40">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-500">
            end to end
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            From commitment to on-chain proof.
          </h2>
        </div>

        <div className="mt-16 grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-10">
          <ol className="relative space-y-10 border-l border-zinc-800 pl-10">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.05, duration: 0.45 }}
                className="relative"
              >
                <span className="absolute -left-[3.15rem] flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/30 bg-zinc-950 font-mono text-xs text-emerald-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-semibold text-zinc-100">
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-400">
                  {step.body}
                </p>
              </motion.li>
            ))}
          </ol>

          {/* agent ecosystem centerpiece */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:sticky lg:top-28"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 scale-105 rounded-full bg-emerald-500/10 blur-[80px]" />
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="relative aspect-[1376/768] overflow-hidden rounded-2xl border border-emerald-500/15 bg-zinc-950/60 shadow-[0_0_60px_-24px_rgba(16,185,129,0.35)]"
              >
                <Image
                  alt="A network of distributed AI agents, each verified through TrustMesh's central proof engine, illustrating how agent decisions connect to on-chain verification"
                  src="/images/agent-ecosystem.png"
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}