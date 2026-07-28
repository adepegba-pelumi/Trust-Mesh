import type { ReactNode } from "react";

import { glassPanel } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className }: GlassPanelProps) {
  return <div className={cn(glassPanel, className)}>{children}</div>;
}
