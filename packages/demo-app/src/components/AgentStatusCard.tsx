"use client";

import { sepoliaExplorerAddress } from "@/config/web3";
import { formatModelCommitment, formatTimestamp, normalizeCommitment } from "@/lib/format";
import type { AuditRow } from "@/types/demo";

type AgentStatusCardProps = {
  agentAddress: string;
  modelCommitment: string | null;
  lastDecision: AuditRow | null;
  isRunning: boolean;
};

export function AgentStatusCard({
  agentAddress,
  modelCommitment,
  lastDecision,
  isRunning,
}: AgentStatusCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Agent status
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            TrustMesh Sepolia Agent
          </h1>
          <a
            className="mt-1 inline-block font-mono text-sm text-sky-600 hover:underline dark:text-sky-400"
            href={sepoliaExplorerAddress(agentAddress)}
            rel="noreferrer"
            target="_blank"
          >
            {agentAddress}
          </a>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isRunning
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          }`}
        >
          {isRunning ? "Pipeline running" : "Ready"}
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Model commitment</dt>
          <dd className="mt-2 font-mono text-sm text-zinc-900 dark:text-zinc-100">
            {modelCommitment
              ? formatModelCommitment(normalizeCommitment(modelCommitment))
              : "Not registered yet"}
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Last decision</dt>
          <dd className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
            {lastDecision ? formatTimestamp(lastDecision.timestamp) : "No verified decisions yet"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
