"use client";

import { useReducedMotion } from "framer-motion";
import type { Transition, Variants } from "framer-motion";

/** Shared easing curves for premium, intentional motion. */
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.4, 0, 0.2, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1 },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 0 0 rgba(52,211,153,0)" },
  hover: { y: -4, boxShadow: "0 12px 40px -12px rgba(52,211,153,0.15)" },
};

export const defaultTransition: Transition = {
  duration: 0.5,
  ease: easeOut,
};

export const viewportOnce = { once: true, margin: "-60px" as const };

/** Returns motion-safe variants — instant when user prefers reduced motion. */
export function useMotionVariants() {
  const reduce = useReducedMotion();

  if (reduce) {
    const instant: Variants = { hidden: { opacity: 1 }, show: { opacity: 1 } };
    return {
      fadeUp: instant,
      fadeIn: instant,
      slideUp: instant,
      scaleIn: instant,
      slideInLeft: instant,
      staggerContainer: { hidden: {}, show: {} },
      transition: { duration: 0 } satisfies Transition,
      cardHover: { rest: {}, hover: {} },
    };
  }

  return {
    fadeUp,
    fadeIn,
    slideUp,
    scaleIn,
    slideInLeft,
    staggerContainer,
    transition: defaultTransition,
    cardHover,
  };
}
