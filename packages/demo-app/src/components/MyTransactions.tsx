"use client";

import { ExternalLink } from "lucide-react";

import { sepoliaExplorerAddress, sepoliaExplorerTx } from "@/config/network";
import { sectionLabelMuted } from "@/lib/design-tokens";
import { formatTimestamp, truncateHash } from "@/lib/format";
import type { TrustMeshUserTransaction } from "@/lib/transactions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type MyTransactionsProps = {
  transactions: TrustMeshUserTransaction[];
  isLoading: boolean;
  error: string | null;
};

function StatusPill({ status }: { status: string | null }) {
  const normalized = (status ?? "").toLowerCase();
  const verified =
    normalized === "executed" ||
    normalized === "verified" ||
    normalized === "confirmed" ||
    normalized === "success";
  const rejected =
    normalized === "reverted" ||
    normalized === "rejected" ||
    normalized === "failed" ||
    normalized === "unsafe";

  return (
    <Badge
      className={cn(
        verified && "border-transparent bg-[#EAFBF1] text-[#16A34A]",
        rejected && "border-[#EF4444] bg-white text-[#EF4444]",
        !verified && !rejected && "border-[#EAEAEC] bg-white text-[#6E6E76]",
      )}
      variant={verified ? "success" : rejected ? "destructive" : "outline"}
    >
      {status ? status : "Unknown"}
    </Badge>
  );
}

export function MyTransactions({ transactions, isLoading, error }: MyTransactionsProps) {
  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <p className={sectionLabelMuted}>my activity</p>
        <CardTitle className="mt-2">My transactions</CardTitle>
        <CardDescription>
          TrustMesh activity linked to your account. On-chain Sepolia results remain the source of
          truth for verification.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="min-h-[220px] overflow-x-auto rounded-xl border border-[#EAEAEC]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b border-[#EAEAEC]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6E6E76]">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6E6E76]">
                  Tx hash
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6E6E76]">
                  Wallet
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6E6E76]">
                  Agent
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6E6E76]">
                  Network
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6E6E76]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEC]">
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState className="min-h-[180px] py-14" description="Loading your transactions…" loading />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState className="min-h-[180px] py-14" description={error} />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      className="min-h-[180px] py-14"
                      description="No TrustMesh transactions yet."
                    />
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr className="bg-white transition-colors hover:bg-[#F7F7F8]" key={tx.id}>
                    <td className="px-4 py-4">
                      <StatusPill status={tx.status} />
                    </td>
                    <td className="px-4 py-4">
                      <a
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-[#111111] underline-offset-4 hover:underline"
                        href={sepoliaExplorerTx(tx.tx_hash)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {truncateHash(tx.tx_hash, 8, 6)}
                        <ExternalLink className="h-3.5 w-3.5 text-[#6E6E76]" aria-hidden />
                      </a>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#6E6E76]">
                      {tx.wallet_address ? (
                        <a
                          className="hover:text-[#111111] hover:underline"
                          href={sepoliaExplorerAddress(tx.wallet_address)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {truncateHash(tx.wallet_address, 6, 4)}
                        </a>
                      ) : (
                        <span className="italic text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#6E6E76]">
                      {tx.agent_address ? (
                        <a
                          className="hover:text-[#111111] hover:underline"
                          href={sepoliaExplorerAddress(tx.agent_address)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {truncateHash(tx.agent_address, 6, 4)}
                        </a>
                      ) : (
                        <span className="italic text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[#111111]">Sepolia</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#111111]">
                      {tx.created_at
                        ? formatTimestamp(Math.floor(new Date(tx.created_at).getTime() / 1000))
                        : "—"}
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
