"use client";

import { motion } from "framer-motion";

import { statBox } from "@/lib/design-tokens";
import { useMotionVariants, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StatCardProps = {
  value: string;
  label: string;
  index?: number;
  className?: string;
};

export function StatCard({ value, label, index = 0, className }: StatCardProps) {
  const { fadeUp, transition } = useMotionVariants();

  return (
    <motion.div
      className={cn(statBox, "p-6 text-center", className)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={fadeUp}
      transition={{ ...transition, delay: index * 0.08 }}
    >
      <p className="font-mono text-3xl font-semibold text-emerald-400">{value}</p>
      <p className="mt-2 text-xs leading-snug text-zinc-500">{label}</p>
    </motion.div>
  );
}
