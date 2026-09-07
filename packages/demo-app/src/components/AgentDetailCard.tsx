"use client";

import type { ReactNode } from "react";

import { sepoliaExplorerAddress } from "@/config/web3";
import { fieldLabel, sectionLabelMuted } from "@/lib/design-tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatModelCommitment, formatTimestamp, normalizeCommitment } from "@/lib/format";
import type { AuditRow } from "@/types/demo";
import { cn } from "@/lib/utils";

type AgentDetailCardProps = {
  agentAddress: string;
  modelCommitment: string | null;
  lastDecision: AuditRow | null;
  isRunning: boolean;
};

function ReceiptRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-[#EAEAEC] py-4 last:border-b-0 last:pb-0 first:pt-0", className)}>
      <dt className={fieldLabel}>{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}

export function AgentDetailCard({
  agentAddress,
  modelCommitment,
  lastDecision,
  isRunning,
}: AgentDetailCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-0 p-6 pb-4">
        <p className={sectionLabelMuted}>agent detail</p>
        <CardTitle className="mt-2 text-[#111111]">TrustMesh Sepolia Agent</CardTitle>
        <p className="mt-1.5 text-sm text-[#6E6E76]">
          {isRunning ? "Pipeline running" : "Idle — waiting for demo run"}
        </p>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <dl>
          <ReceiptRow label="Wallet address">
            <a
              className="break-all font-mono text-sm text-[#6E6E76] transition-colors hover:text-[#111111] hover:underline"
              href={sepoliaExplorerAddress(agentAddress)}
              rel="noreferrer"
              target="_blank"
            >
              {agentAddress}
            </a>
          </ReceiptRow>

          <ReceiptRow label="Model commitment">
            <span
              className={cn(
                "font-mono text-sm",
                modelCommitment ? "text-[#111111]" : "italic text-[#9CA3AF]",
              )}
            >
              {modelCommitment
                ? formatModelCommitment(normalizeCommitment(modelCommitment))
                : "Not registered yet"}
            </span>
          </ReceiptRow>

          <ReceiptRow label="Last decision">
            <span
              className={cn(
                "text-sm",
                lastDecision ? "text-[#111111]" : "italic text-[#9CA3AF]",
              )}
            >
              {lastDecision ? formatTimestamp(lastDecision.timestamp) : "No verified decisions yet"}
            </span>
          </ReceiptRow>
        </dl>
      </CardContent>
    </Card>
  );
}
