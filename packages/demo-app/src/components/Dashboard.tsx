"use client";

import { AppNav } from "@/components/AppNav";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { AuditTrail } from "@/components/AuditTrail";
import { PageShell } from "@/components/PageShell";
import { PipelineVisual } from "@/components/PipelineVisual";
import { MotionReveal } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { pageMain } from "@/lib/design-tokens";
import {
  useAgentEvents,
  useAgentStatus,
  useDemoRunner,
} from "@/hooks/useAgentEvents";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const runner = useDemoRunner();
  const { agentAddress, modelCommitment } = useAgentStatus(runner.modelCommitment);
  const { rows, lastDecision, isLoading } = useAgentEvents(runner.demoAuditRows);

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
          <AgentStatusCard
            agentAddress={agentAddress}
            isRunning={runner.isRunning}
            lastDecision={lastDecision}
            modelCommitment={modelCommitment}
          />
        </MotionReveal>

        <MotionReveal delay={0.08}>
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
        </MotionReveal>

        <MotionReveal delay={0.16}>
          <AuditTrail isLoading={isLoading} rows={rows} />
        </MotionReveal>
      </main>
    </PageShell>
  );
}
