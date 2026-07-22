"use client";

import { sepoliaExplorerTx } from "@/config/web3";
import { formatModelCommitment, formatTimestamp, normalizeCommitment } from "@/lib/format";
import type { AuditRow } from "@/types/demo";

type AuditTrailProps = {
  rows: AuditRow[];
  isLoading: boolean;
};

function StatusBadge({ status }: { status: AuditRow["status"] }) {
  if (status === "executed") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        Executed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
      Reverted
    </span>
  );
}

export function AuditTrail({ rows, isLoading }: AuditTrailProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Audit trail
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          VerifiedDecision events
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          On-chain decisions from the safety interceptor, newest first. All values are read from
          Sepolia — no fabricated data.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-3 py-3 font-medium">Timestamp</th>
              <th className="px-3 py-3 font-medium">Model commitment</th>
              <th className="px-3 py-3 font-medium">Public inputs</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Etherscan</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-3 py-6 text-zinc-500" colSpan={5}>
                  Loading on-chain events…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-zinc-500" colSpan={5}>
                  No decisions yet. Run the demo to produce a verified transaction.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-3 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                    {row.timestamp > 0 ? formatTimestamp(row.timestamp) : "—"}
                  </td>
                  <td className="px-3 py-4 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                    {row.modelCommitment === "—"
                      ? "—"
                      : formatModelCommitment(normalizeCommitment(row.modelCommitment))}
                  </td>
                  <td className="px-3 py-4 text-zinc-700 dark:text-zinc-300">
                    {row.publicInputsLabel}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-4">
                    {row.transactionHash !== "0x" ? (
                      <a
                        className="font-mono text-xs text-sky-600 hover:underline dark:text-sky-400"
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
    </section>
  );
}
