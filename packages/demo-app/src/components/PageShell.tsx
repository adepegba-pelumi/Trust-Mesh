import type { ReactNode } from "react";

import { MeshBackground } from "@/components/illustrations/MeshBackground";
import { cn } from "@/lib/utils";

/** Re-export design tokens for backward compatibility */
export {
  fieldLabel,
  glassPanel,
  linkAccent,
  pageSubtitle,
  pageTitle,
  sectionLabel,
  statBox,
  surfaceCard,
} from "@/lib/design-tokens";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Ambient zinc/emerald background shared across all pages. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100", className)}>
      <MeshBackground />
      <div className="relative">{children}</div>
    </div>
  );
}
