"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAccount } from "wagmi";

import { AgentDetailCard } from "@/components/AgentDetailCard";
import { AppNav } from "@/components/AppNav";
import { AuditTrail } from "@/components/AuditTrail";
import { DashboardStats } from "@/components/DashboardStats";
import { MyTransactions } from "@/components/MyTransactions";
import { PageShell } from "@/components/PageShell";
import { PipelineVisual } from "@/components/PipelineVisual";
import { MotionReveal } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { pageMain } from "@/lib/design-tokens";
import { recordUserTransaction } from "@/lib/recordUserTransaction";
import {
  useAgentEvents,
  useAgentStatus,
  useDemoRunner,
} from "@/hooks/useAgentEvents";
import { useMyTransactions } from "@/hooks/useMyTransactions";
import type { StageTiming } from "@/types/demo";
import { cn } from "@/lib/utils";

function formatMedianProofTime(
  stageTimings: Partial<Record<string, StageTiming>>,
  priorMs: number[],
): string {
  const samples = [...priorMs];
  const proving = stageTimings.proving?.elapsedMs;
  if (typeof proving === "number" && proving > 0) {
    samples.push(proving);
  }
  if (samples.length === 0) return "—";

  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;

  const seconds = median / 1000;
  if (seconds < 12) return "<12s";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${(seconds / 60).toFixed(1)}m`;
}

export function Dashboard() {
  const { address: walletAddress } = useAccount();
  const runner = useDemoRunner();
  const { agentAddress, modelCommitment } = useAgentStatus(runner.modelCommitment);
  const { rows, lastDecision, isLoading } = useAgentEvents(runner.demoAuditRows);
  const {
    transactions,
    isLoading: myTxLoading,
    error: myTxError,
    refresh: refreshMyTransactions,
  } = useMyTransactions(true);

  const recordedHashes = useRef(new Set<string>());

  useEffect(() => {
    const candidates: { hash: string; status: string }[] = [];

    if (runner.lastTxHash && /^0x[0-9a-fA-F]{64}$/.test(runner.lastTxHash)) {
      candidates.push({ hash: runner.lastTxHash, status: "confirmed" });
    }

    // Prefer demo-produced rows (this session). Do not bulk-import historical
    // chain VerifiedDecision events — those may belong to other operators.
    for (const row of runner.demoAuditRows) {
      if (row.transactionHash && row.transactionHash !== "0x") {
        candidates.push({
          hash: row.transactionHash,
          status: row.status === "executed" ? "executed" : "reverted",
        });
      }
    }

    for (const row of rows) {
      if (row.source !== "demo") continue;
      if (row.transactionHash && row.transactionHash !== "0x") {
        candidates.push({
          hash: row.transactionHash,
          status: row.status === "executed" ? "executed" : "reverted",
        });
      }
    }

    for (const candidate of candidates) {
      if (recordedHashes.current.has(candidate.hash)) continue;
      recordedHashes.current.add(candidate.hash);
      void recordUserTransaction({
        tx_hash: candidate.hash,
        status: candidate.status,
        wallet_address: walletAddress ?? null,
        agent_address: agentAddress || null,
      }).then((ok) => {
        if (ok) void refreshMyTransactions();
        else recordedHashes.current.delete(candidate.hash);
      });
    }
  }, [
    runner.lastTxHash,
    runner.demoAuditRows,
    rows,
    walletAddress,
    agentAddress,
    refreshMyTransactions,
  ]);

  const decisionsVerified = useMemo(
    () => rows.filter((row) => row.status === "executed").length,
    [rows],
  );

  const medianProofTime = useMemo(
    () => formatMedianProofTime(runner.stageTimings, []),
    [runner.stageTimings],
  );

  return (
    <PageShell>
      <AppNav />

      <main className={cn(pageMain)}>
        <PageHeader
          description="Run the Sepolia agent pipeline, watch stage timings, and inspect VerifiedDecision events."
          label="dashboard"
          title="Live demo"
        />

        <MotionReveal>
          <DashboardStats
            decisionsVerified={decisionsVerified}
            isRunning={runner.isRunning}
            medianProofTime={medianProofTime}
            modelCommitment={modelCommitment}
          />
        </MotionReveal>

        <MotionReveal delay={0.06}>
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PipelineVisual
                error={runner.error}
                isRunning={runner.isRunning}
                onReset={runner.resetPipeline}
                onRunDemo={() => runner.runDemo(false)}
                onRunUnsafe={() => runner.runDemo(true)}
                pipelineState={runner.pipelineState}
                stageOrder={runner.stageOrder}
                stageTimings={runner.stageTimings}
              />
            </div>
            <div className="lg:col-span-2">
              <AgentDetailCard
                agentAddress={agentAddress}
                isRunning={runner.isRunning}
                lastDecision={lastDecision}
                modelCommitment={modelCommitment}
              />
            </div>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.1}>
          <MyTransactions
            error={myTxError}
            isLoading={myTxLoading}
            transactions={transactions}
          />
        </MotionReveal>

        <MotionReveal delay={0.14}>
          <AuditTrail isLoading={isLoading} rows={rows} />
        </MotionReveal>
      </main>
    </PageShell>
  );
}
