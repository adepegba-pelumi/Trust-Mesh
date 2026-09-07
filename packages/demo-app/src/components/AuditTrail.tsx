"use client";

import { ExternalLink, ScrollText } from "lucide-react";

import { sepoliaExplorerTx } from "@/config/web3";
import { fieldLabel, sectionLabelMuted } from "@/lib/design-tokens";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatModelCommitment, formatTimestamp, normalizeCommitment } from "@/lib/format";
import type { AuditRow } from "@/types/demo";
import { cn } from "@/lib/utils";

type AuditTrailProps = {
  rows: AuditRow[];
  isLoading: boolean;
};

function StatusBadge({ status }: { status: AuditRow["status"] }) {
  if (status === "executed") {
    return (
      <Badge className="border-transparent bg-[#EAFBF1] text-[#16A34A]" variant="success">
        Verified
      </Badge>
    );
  }

  return (
    <Badge className="border-[#EF4444] bg-white text-[#EF4444]" variant="destructive">
      Rejected
    </Badge>
  );
}

export function AuditTrail({ rows, isLoading }: AuditTrailProps) {
  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <p className={sectionLabelMuted}>audit trail</p>
        <CardTitle className="mt-2">VerifiedDecision events</CardTitle>
        <CardDescription>
          On-chain decisions from the safety interceptor, newest first. All values are read from
          Sepolia — no fabricated data.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="min-h-[280px] overflow-x-auto rounded-xl border border-[#EAEAEC]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b border-[#EAEAEC]">
                <th className={cn(fieldLabel, "px-4 py-3 font-semibold")} scope="col">
                  Timestamp
                </th>
                <th className={cn(fieldLabel, "px-4 py-3 font-semibold")} scope="col">
                  Model commitment
                </th>
                <th className={cn(fieldLabel, "px-4 py-3 font-semibold")} scope="col">
                  Public inputs
                </th>
                <th className={cn(fieldLabel, "px-4 py-3 font-semibold")} scope="col">
                  Status
                </th>
                <th className={cn(fieldLabel, "px-4 py-3 font-semibold text-center")} scope="col">
                  Tx
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEC]">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState className="min-h-[220px] py-16" description="Loading on-chain events…" loading />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      className="min-h-[220px] py-16"
                      description="No decisions yet. Run the demo to produce a verified transaction."
                      icon={<ScrollText className="h-8 w-8 text-[#9CA3AF]" strokeWidth={1.5} />}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr className="bg-white transition-colors hover:bg-[#F7F7F8]" key={row.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-[#111111]">
                      {row.timestamp > 0 ? formatTimestamp(row.timestamp) : "—"}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#6E6E76]">
                      {row.modelCommitment === "—"
                        ? "—"
                        : formatModelCommitment(normalizeCommitment(row.modelCommitment))}
                    </td>
                    <td className="px-4 py-4 text-[#111111]">{row.publicInputsLabel}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.transactionHash !== "0x" ? (
                        <a
                          aria-label="View transaction on Etherscan"
                          className="inline-flex text-[#6E6E76] transition-colors hover:text-[#111111]"
                          href={sepoliaExplorerTx(row.transactionHash)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-xs italic text-[#9CA3AF]">Sim</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-[#9CA3AF]">
          Events sync from the TrustMeshVerifier contract on Sepolia. Run the live pipeline to
          append a new VerifiedDecision.
        </p>
      </CardContent>
    </Card>
  );
}
