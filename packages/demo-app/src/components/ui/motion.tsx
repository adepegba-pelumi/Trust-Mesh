"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

import { useMotionVariants, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MotionRevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  variant?: "fadeUp" | "fadeIn" | "slideUp" | "scaleIn" | "slideInLeft";
};

export function MotionReveal({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
  ...props
}: MotionRevealProps) {
  const motionVars = useMotionVariants();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={motionVars[variant]}
      transition={{ ...motionVars.transition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export function Stagger({ children, className, stagger = 0.1 }: StaggerProps) {
  const { staggerContainer, transition } = useMotionVariants();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={staggerContainer}
      transition={{ ...transition, staggerChildren: stagger }}
    >
      {children}
    </motion.div>
  );
}

type MotionCardProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  lift?: boolean;
};

export function MotionCard({ children, className, lift = false, ...props }: MotionCardProps) {
  const { fadeUp, transition } = useMotionVariants();

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={fadeUp}
      transition={transition}
      whileHover={lift ? { y: -4 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
