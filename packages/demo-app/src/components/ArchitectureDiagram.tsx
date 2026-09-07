"use client";

import { cn } from "@/lib/utils";

const steps = [
  "Agent weights",
  "KZG commit",
  "Halo2 proof",
  "TrustMeshVerifier",
  "DeFi target",
  "Audit event",
];

type ArchitectureDiagramProps = {
  compact?: boolean;
  className?: string;
};

function StepPill({ label }: { label: string }) {
  return (
    <span className="inline-flex flex-1 items-center justify-center rounded-md border border-[#22C55E]/35 bg-[#22C55E]/10 px-2.5 py-2.5 text-center text-xs font-medium text-[#4ADE80] sm:text-[13px]">
      {label}
    </span>
  );
}

function FlowRow({ items }: { items: string[] }) {
  return (
    <div className="flex w-full items-center gap-2">
      {items.map((step, index) => (
        <div className="contents" key={step}>
          <div className="min-w-0 flex-1">
            <StepPill label={step} />
          </div>
          {index < items.length - 1 ? (
            <span aria-hidden className="shrink-0 text-sm text-white/40">
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Black pipeline strip with aligned arrows — one row on desktop, two on smaller screens. */
export function ArchitectureDiagram({ compact = false, className }: ArchitectureDiagramProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#111111] bg-[#111111] px-6 py-8 sm:px-8 sm:py-10",
        className,
      )}
    >
      {!compact ? (
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/50">
          Architecture
        </p>
      ) : null}

      {/* Desktop: single row */}
      <div className="hidden lg:block" aria-label="TrustMesh production pipeline">
        <FlowRow items={steps} />
      </div>

      {/* Tablet / mobile: two rows of three, arrows vertically centered */}
      <div className="flex flex-col gap-4 lg:hidden" aria-label="TrustMesh production pipeline">
        <FlowRow items={steps.slice(0, 3)} />
        <div className="flex justify-center" aria-hidden>
          <span className="text-sm text-white/40">↓</span>
        </div>
        <FlowRow items={steps.slice(3)} />
      </div>
    </div>
  );
}
