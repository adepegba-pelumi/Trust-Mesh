"use client";

import { fieldLabel, surfaceCard } from "@/lib/design-tokens";
import { formatModelCommitment, normalizeCommitment } from "@/lib/format";
import { cn } from "@/lib/utils";

type DashboardStatsProps = {
  modelCommitment: string | null;
  decisionsVerified: number;
  medianProofTime: string;
  isRunning: boolean;
};

export function DashboardStats({
  modelCommitment,
  decisionsVerified,
  medianProofTime,
  isRunning,
}: DashboardStatsProps) {
  const statusLabel = isRunning ? "Running" : "Ready";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className={cn(surfaceCard, "p-6")}>
        <p className={fieldLabel}>Model commitment</p>
        <p
          className={cn(
            "mt-3 truncate font-mono text-sm font-semibold",
            modelCommitment ? "text-[#111111]" : "italic text-[#9CA3AF]",
          )}
          title={modelCommitment ? normalizeCommitment(modelCommitment) : undefined}
        >
          {modelCommitment
            ? formatModelCommitment(normalizeCommitment(modelCommitment))
            : "—"}
        </p>
      </div>

      <div className={cn(surfaceCard, "p-6")}>
        <p className={fieldLabel}>Decisions verified</p>
        <p
          className={cn(
            "mt-3 text-3xl font-bold tracking-tight",
            decisionsVerified > 0 ? "text-[#22C55E]" : "text-[#111111]",
          )}
        >
          {decisionsVerified}
        </p>
      </div>

      <div className={cn(surfaceCard, "p-6")}>
        <p className={fieldLabel}>Median proof time</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-[#111111]">{medianProofTime}</p>
      </div>

      <div className={cn(surfaceCard, "p-6")}>
        <p className={fieldLabel}>Agent status</p>
        <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-[#111111]">
          {!isRunning ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
          ) : (
            <span
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#111111]"
              aria-hidden
            />
          )}
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
