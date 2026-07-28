"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* ambient gradient field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] [background-size:34px_34px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28 sm:pt-36">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.12 }}
            className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 backdrop-blur lg:mx-0"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                live on sepolia
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-balance text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-zinc-50 sm:text-6xl"
            >
              Trust every decision
              <br />
              your AI agent makes.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-zinc-400 lg:mx-0"
            >
              TrustMesh binds model commitments to zero-knowledge proofs, so
              every inference can be verified on-chain — without ever exposing
              the model or the data behind it.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 text-emerald-950 shadow-[0_0_28px_-6px_rgba(52,211,153,0.55)] hover:bg-emerald-400"
              >
                <Link href="/dashboard">
                  Get started
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-zinc-800 bg-transparent text-zinc-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300"
              >
                <Link href="/docs">
                  <FileText className="mr-1.5 h-4 w-4" />
                  View documentation
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* hero artwork */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative mx-auto aspect-[1376/768] w-full max-w-xl lg:max-w-none"
          >
            {/* glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 scale-110">
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.5, 0.85, 0.5] }
                }
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-emerald-500/20 blur-[90px]"
              />
            </div>

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -10, 0], rotate: [0, 0.6, 0, -0.6, 0] }
              }
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-zinc-950/40 shadow-[0_0_60px_-20px_rgba(16,185,129,0.35)] backdrop-blur"
            >
              <Image
                alt="Visualization of AI model nodes connected through encrypted data pipelines into a central verification core, representing TrustMesh's proof network"
                src="/images/hero-network.png"
                width={1376}
                height={768}
                priority
                sizes="(min-width: 1024px) 44vw, (min-width: 640px) 70vw, 92vw"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}