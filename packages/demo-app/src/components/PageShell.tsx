import type { ReactNode } from "react";

import { Footer } from "@/components/Footer";
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

/** Clean white canvas with site footer on every page. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("relative flex min-h-screen flex-col bg-white text-[#111111]", className)}>
      <div className="relative flex-1">{children}</div>
      <Footer />
    </div>
  );
}
