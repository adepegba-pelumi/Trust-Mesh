"use client";

import { sepoliaExplorerAddress } from "@/config/web3";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Agent status
          </p>
          <CardTitle className="mt-2 text-2xl">TrustMesh Sepolia Agent</CardTitle>
          <a
            className="mt-1 inline-block font-mono text-sm text-primary hover:underline"
            href={sepoliaExplorerAddress(agentAddress)}
            rel="noreferrer"
            target="_blank"
          >
            {agentAddress}
          </a>
        </div>
        <Badge variant={isRunning ? "warning" : "success"}>
          {isRunning ? "Pipeline running" : "Ready"}
        </Badge>
      </CardHeader>

      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Model commitment</dt>
            <dd className="mt-2 font-mono text-sm">
              {modelCommitment
                ? formatModelCommitment(normalizeCommitment(modelCommitment))
                : "Not registered yet"}
            </dd>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last decision</dt>
            <dd className="mt-2 text-sm">
              {lastDecision ? formatTimestamp(lastDecision.timestamp) : "No verified decisions yet"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
