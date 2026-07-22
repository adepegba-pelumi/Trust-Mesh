"use client";

import type { PipelineStageId, PipelineState, StageTiming } from "@/types/demo";

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
  proving: "Generate proof of inference (Stage 2 mock prover)",
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
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Live pipeline
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Observe → Infer → Prove → Verify → Execute
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            disabled={isRunning}
            onClick={onRunDemo}
            type="button"
          >
            Run demo
          </button>
          <button
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
            disabled={isRunning}
            onClick={onRunUnsafe}
            type="button"
          >
            Trigger unsafe transaction
          </button>
          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            disabled={isRunning}
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      <ol className="mt-8 grid gap-4 md:grid-cols-5">
        {stageOrder.map((stage) => {
          const active = isStageActive(stage, pipelineState);
          const complete = isStageComplete(stage, pipelineState, stageOrder, stageTimings);
          const timing = stageTimings[stage];

          return (
            <li
              key={stage}
              className={`relative rounded-xl border p-4 transition ${
                active
                  ? "border-sky-400 bg-sky-50 shadow-md dark:border-sky-500 dark:bg-sky-950/40"
                  : complete
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    active
                      ? "animate-pulse bg-sky-500"
                      : complete
                        ? "bg-emerald-500"
                        : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {STAGE_DESCRIPTIONS[stage]}
              </p>
              <p className="mt-3 font-mono text-xs text-zinc-500">
                {timing ? `${timing.elapsedMs.toLocaleString()} ms` : active ? "Running…" : "—"}
              </p>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {pipelineState === "done" ? (
        <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">
          Pipeline complete — results recorded on Sepolia and in the audit trail below.
        </p>
      ) : null}
    </section>
  );
}
