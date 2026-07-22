"use client";

import { AppNav } from "@/components/AppNav";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { AuditTrail } from "@/components/AuditTrail";
import { PageShell, pageSubtitle, pageTitle, sectionLabel } from "@/components/PageShell";
import { PipelineVisual } from "@/components/PipelineVisual";
import {
  useAgentEvents,
  useAgentStatus,
  useDemoRunner,
} from "@/hooks/useAgentEvents";

export function Dashboard() {
  const runner = useDemoRunner();
  const { agentAddress, modelCommitment } = useAgentStatus(runner.modelCommitment);
  const { rows, lastDecision, isLoading } = useAgentEvents(runner.demoAuditRows);

  return (
    <PageShell>
      <AppNav />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div>
          <p className={sectionLabel}>dashboard</p>
          <h1 className={pageTitle}>Live demo</h1>
          <p className={pageSubtitle}>
            Run the Sepolia agent pipeline, watch stage timings, and inspect VerifiedDecision events.
          </p>
        </div>

        <AgentStatusCard
          agentAddress={agentAddress}
          isRunning={runner.isRunning}
          lastDecision={lastDecision}
          modelCommitment={modelCommitment}
        />

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

        <AuditTrail isLoading={isLoading} rows={rows} />
      </main>
    </PageShell>
  );
}
