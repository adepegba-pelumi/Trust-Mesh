"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { sectionDescription, sectionLabel, sectionSpacing, sectionTitle } from "@/lib/design-tokens";
import { useMotionVariants, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { Container } from "./container";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  containerClassName?: string;
  bordered?: boolean;
  muted?: boolean;
};

export function Section({
  children,
  id,
  className,
  containerClassName,
  bordered = false,
  muted = false,
}: SectionProps) {
  return (
    <section
      className={cn(
        sectionSpacing,
        bordered && "border-t border-zinc-900",
        muted && "bg-zinc-950/40",
        className,
      )}
      id={id}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

type SectionHeaderProps = {
  label: string;
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
  labelMuted?: boolean;
};

export function SectionHeader({
  label,
  title,
  description,
  className,
  centered = true,
  labelMuted = false,
}: SectionHeaderProps) {
  const { fadeUp, transition } = useMotionVariants();

  return (
    <motion.div
      className={cn(centered && "mx-auto max-w-2xl text-center", className)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={fadeUp}
      transition={transition}
    >
      <p className={labelMuted ? "font-mono text-xs uppercase tracking-widest text-zinc-500" : sectionLabel}>
        {label}
      </p>
      <h2 className={cn("mt-4", sectionTitle)}>{title}</h2>
      {description ? <p className={sectionDescription}>{description}</p> : null}
    </motion.div>
  );
}
