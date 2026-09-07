"use client";

import { motion, useReducedMotion } from "framer-motion";

export function MeshBackground() {
  const reduce = useReducedMotion();

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(237,235,228,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(237,235,228,0.7)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_55%_at_50%_0%,black_35%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand-mint/80 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-[#f3f0e6]/70 blur-[90px]"
      />
      {!reduce ? (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          className="pointer-events-none absolute bottom-0 left-[-5%] h-[26rem] w-[26rem] translate-y-1/4 rounded-full bg-brand-mint/60 blur-[100px]"
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </>
  );
}

export function HeroGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-mint/70 blur-[100px]" />
      <div className="absolute right-[8%] top-[20%] h-[280px] w-[280px] rounded-full bg-[#f0ebe0]/80 blur-[80px]" />
    </div>
  );
}
