"use client";

import { sepoliaExplorerTx } from "@/config/web3";
import { fieldLabel, linkAccent, sectionLabel } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatModelCommitment, formatTimestamp, normalizeCommitment } from "@/lib/format";
import type { AuditRow } from "@/types/demo";

type AuditTrailProps = {
  rows: AuditRow[];
  isLoading: boolean;
};

function StatusBadge({ status }: { status: AuditRow["status"] }) {
  return (
    <Badge variant={status === "executed" ? "success" : "destructive"}>
      {status === "executed" ? "Executed" : "Reverted"}
    </Badge>
  );
}

export function AuditTrail({ rows, isLoading }: AuditTrailProps) {
  return (
    <Card>
      <CardHeader>
        <p className={sectionLabel}>audit trail</p>
        <CardTitle className="mt-2 text-xl text-zinc-100">VerifiedDecision events</CardTitle>
        <CardDescription className="text-zinc-400">
          On-chain decisions from the safety interceptor, newest first. All values are read from
          Sepolia — no fabricated data.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/60">
              <tr className={fieldLabel}>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Model commitment</th>
                <th className="px-4 py-3 font-medium">Public inputs</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Etherscan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={5}>
                    Loading on-chain events…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={5}>
                    No decisions yet. Run the demo to produce a verified transaction.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr className="bg-zinc-950/40 transition-colors hover:bg-zinc-900/40" key={row.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-zinc-300">
                      {row.timestamp > 0 ? formatTimestamp(row.timestamp) : "—"}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-zinc-400">
                      {row.modelCommitment === "—"
                        ? "—"
                        : formatModelCommitment(normalizeCommitment(row.modelCommitment))}
                    </td>
                    <td className="px-4 py-4 text-zinc-300">{row.publicInputsLabel}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-4">
                      {row.transactionHash !== "0x" ? (
                        <a
                          className={linkAccent}
                          href={sepoliaExplorerTx(row.transactionHash)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {row.transactionHash.slice(0, 10)}…
                        </a>
                      ) : (
                        <span className="text-zinc-500">Simulation only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
