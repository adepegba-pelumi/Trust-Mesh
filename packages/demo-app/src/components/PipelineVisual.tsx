"use client";

import type { PipelineStageId, PipelineState, StageTiming } from "@/types/demo";
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
  observing: "Read live market data from the portfolio environment",
  inferring: "Run the registered model and derive concentration metrics",
  proving: "Generate Halo2 proof of inference via trustmesh-prove",
  verifying: "Submit PLONK proof to TrustMeshVerifier on Sepolia",
  executing: "Safety interceptor check and VerifiedDecision emission",
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Live pipeline
          </p>
          <CardTitle className="mt-2 text-xl">Observe → Infer → Prove → Verify → Execute</CardTitle>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled={isRunning} onClick={onRunDemo} type="button">
            Run demo
          </Button>
          <Button disabled={isRunning} onClick={onRunUnsafe} type="button" variant="destructive">
            Trigger unsafe transaction
          </Button>
          <Button disabled={isRunning} onClick={onReset} type="button" variant="outline">
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent>
      <ol className="grid gap-4 md:grid-cols-5">
        {stageOrder.map((stage) => {
          const active = isStageActive(stage, pipelineState);
          const complete = isStageComplete(stage, pipelineState, stageOrder, stageTimings);
          const timing = stageTimings[stage];

          return (
            <li
              key={stage}
              className={cn(
                "relative rounded-xl border p-4 transition",
                active && "border-primary/50 bg-primary/5 shadow-md",
                !active && complete && "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                !active && !complete && "border-border bg-muted/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{STAGE_LABELS[stage]}</span>
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    active && "animate-pulse bg-primary",
                    !active && complete && "bg-emerald-500",
                    !active && !complete && "bg-muted-foreground/30",
                  )}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {STAGE_DESCRIPTIONS[stage]}
              </p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {timing ? `${timing.elapsedMs.toLocaleString()} ms` : active ? "Running…" : "—"}
              </p>
            </li>
          );
        })}
      </ol>

      {error ? (
        <Alert className="mt-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {pipelineState === "done" ? (
        <p className="mt-4 text-sm text-primary">
          Pipeline complete — results recorded on Sepolia and in the audit trail below.
        </p>
      ) : null}
      </CardContent>
    </Card>
  );
}
