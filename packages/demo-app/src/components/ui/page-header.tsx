"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { pageSubtitle, pageTitle, sectionLabelMuted } from "@/lib/design-tokens";
import { useMotionVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  label: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ label, title, description, actions, className }: PageHeaderProps) {
  const { fadeUp, transition } = useMotionVariants();

  return (
    <motion.div
      className={cn("flex flex-wrap items-end justify-between gap-4", className)}
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={transition}
    >
      <div>
        <p className={sectionLabelMuted}>{label}</p>
        <h1 className={pageTitle}>{title}</h1>
        {description ? <p className={pageSubtitle}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </motion.div>
  );
}
