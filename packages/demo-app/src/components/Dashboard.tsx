"use client";

import { AppNav } from "@/components/AppNav";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { AuditTrail } from "@/components/AuditTrail";
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <AppNav />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
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
    </div>
  );
}
