"use client";

import { Check } from "lucide-react";

import type { PipelineStageId, PipelineState, StageTiming } from "@/types/demo";
import { sectionLabelMuted } from "@/lib/design-tokens";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<PipelineStageId, string> = {
  observing: "Observe",
  inferring: "Infer",
  proving: "Prove",
  verifying: "Verify",
  executing: "Execute",
};

const STAGE_DESCRIPTIONS: Record<PipelineStageId, string> = {
  observing: "Read live market data",
  inferring: "Run model & concentration",
  proving: "Generate Halo2 proof",
  verifying: "Submit PLONK on Sepolia",
  executing: "Safety check & emit event",
};

type PipelineVisualProps = {
  pipelineState: PipelineState;
  stageOrder: PipelineStageId[];
  stageTimings: Partial<Record<PipelineStageId, StageTiming>>;
  isRunning: boolean;
  error: string | null;
  onRunDemo: () => void;
  onRunUnsafe: () => void;
  onReset: () => void;
};

function stageIndex(stage: PipelineStageId, order: PipelineStageId[]): number {
  return order.indexOf(stage);
}

function isStageActive(stage: PipelineStageId, pipelineState: PipelineState): boolean {
  if (pipelineState === "idle" || pipelineState === "done" || pipelineState === "error") {
    return false;
  }
  return pipelineState === stage;
}

function isStageComplete(
  stage: PipelineStageId,
  pipelineState: PipelineState,
  order: PipelineStageId[],
  stageTimings: Partial<Record<PipelineStageId, StageTiming>>,
): boolean {
  if (stageTimings[stage]) return true;
  if (pipelineState === "done") return true;
  if (pipelineState === "idle" || pipelineState === "error") return false;
  return stageIndex(stage, order) < stageIndex(pipelineState as PipelineStageId, order);
}

export function PipelineVisual({
  pipelineState,
  stageOrder,
  stageTimings,
  isRunning,
  error,
  onRunDemo,
  onRunUnsafe,
  onReset,
}: PipelineVisualProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 p-6">
        <div>
          <p className={sectionLabelMuted}>live pipeline</p>
          <CardTitle className="mt-2 text-base font-semibold sm:text-lg">
            <span className="text-[#111111]">Observe</span>
            <span className="mx-1.5 text-[#9CA3AF]">→</span>
            <span className="text-[#111111]">Infer</span>
            <span className="mx-1.5 text-[#9CA3AF]">→</span>
            <span className="text-[#111111]">Prove</span>
            <span className="mx-1.5 text-[#9CA3AF]">→</span>
            <span className="text-[#111111]">Verify</span>
            <span className="mx-1.5 text-[#9CA3AF]">→</span>
            <span className="text-[#111111]">Execute</span>
          </CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isRunning} onClick={onRunDemo} type="button">
            Run demo
          </Button>
          <Button disabled={isRunning} onClick={onRunUnsafe} type="button" variant="destructive">
            Trigger unsafe transaction
          </Button>
          <Button disabled={isRunning} onClick={onReset} type="button" variant="secondary">
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <ol
          aria-label="Pipeline stages"
          className="relative grid grid-cols-5 gap-1 sm:gap-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-[10%] right-[10%] top-4 h-px bg-[#EAEAEC]"
          />

          {stageOrder.map((stage, index) => {
            const active = isStageActive(stage, pipelineState);
            const complete = isStageComplete(stage, pipelineState, stageOrder, stageTimings);
            const timing = stageTimings[stage];
            const stepNumber = String(index + 1).padStart(2, "0");

            return (
              <li
                key={stage}
                aria-current={active ? "step" : undefined}
                className="relative z-10 flex min-w-0 flex-col items-center text-center"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-200",
                    active &&
                      "border-[#22C55E] bg-[#22C55E] text-white shadow-[0_0_0_3px_rgba(34,197,94,0.15)]",
                    !active && complete && "border-[#22C55E] bg-[#22C55E] text-white",
                    !active && !complete && "border-[#111111] bg-white text-[#111111]",
                  )}
                >
                  {complete && !active ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  ) : (
                    stepNumber
                  )}
                </span>

                <p className="mt-3 text-xs font-semibold text-[#111111] sm:text-sm">
                  {STAGE_LABELS[stage]}
                </p>
                <p className="mt-1 hidden text-xs leading-snug text-[#6E6E76] sm:block">
                  {STAGE_DESCRIPTIONS[stage]}
                </p>
                <p className="mt-2 font-mono text-[10px] text-[#9CA3AF]">
                  {timing
                    ? `${timing.elapsedMs.toLocaleString()} ms`
                    : active
                      ? "Running…"
                      : "—"}
                </p>
              </li>
            );
          })}
        </ol>

        {error ? (
          <Alert className="mt-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {pipelineState === "done" ? (
          <p className="mt-6 text-sm text-[#6E6E76]" role="status">
            Pipeline complete — results recorded on Sepolia and in the audit trail below.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
