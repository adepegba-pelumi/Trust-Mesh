import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Ambient zinc/emerald background matching the home page. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(52,211,153,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(52,211,153,0.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export const sectionLabel =
  "font-mono text-xs uppercase tracking-widest text-zinc-500";

export const pageTitle =
  "text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl";

export const pageSubtitle = "mt-2 text-sm leading-relaxed text-zinc-400";

export const surfaceCard =
  "rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur";

export const primaryButton =
  "bg-emerald-500 text-emerald-950 shadow-[0_0_24px_-6px_rgba(52,211,153,0.6)] hover:bg-emerald-400";

export const outlineButton =
  "border-zinc-700 bg-transparent text-zinc-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300";

export const linkAccent = "font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline";

export const statBox =
  "rounded-xl border border-zinc-800 bg-zinc-950/60 p-4";

export const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-zinc-500";
