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
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-mint/40 blur-[110px]" />
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
              className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-brand-accent/15 bg-brand-mint px-3.5 py-1.5 lg:mx-0"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-accent" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-accent">
                live on sepolia
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="font-display text-balance text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-brand-charcoal sm:text-6xl"
            >
              Trust every decision
              <br />
              your AI agent makes.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mx-auto mt-6 max-w-xl text-balance text-lg leading-8 text-brand-muted lg:mx-0"
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
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Get started
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs">
                  <FileText className="mr-1.5 h-4 w-4" />
                  View documentation
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative mx-auto aspect-[1376/768] w-full max-w-xl lg:max-w-none"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 scale-110">
              <motion.div
                animate={reduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-brand-mint blur-[80px]"
              />
            </div>

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -10, 0], rotate: [0, 0.5, 0, -0.5, 0] }
              }
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-2xl border border-brand-border bg-white shadow-mint"
            >
              <Image
                alt="Visualization of AI model nodes connected through encrypted data pipelines into a central verification core, representing TrustMesh's proof network"
                src="/images/hero-network.png"
                width={1376}
                height={768}
                priority
                sizes="(min-width: 1024px) 44vw, (min-width: 640px) 70vw, 92vw"
                className="h-full w-full object-cover [filter:saturate(0.92)_sepia(0.12)_brightness(1.04)_contrast(0.98)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
