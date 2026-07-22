import { formatPublicInputs } from "@/lib/format";
import type { AuditRow } from "@/types/demo";

export function logToAuditRow(log: Record<string, unknown>, scenario: string): AuditRow | null {
  const scenarios = log.scenarios as Record<string, Record<string, unknown>> | undefined;
  const record = scenarios?.[scenario === "unsafe" ? "constraint_violation" : "happy_path"];
  if (!record) return null;

  const verify = record.verify as Record<string, unknown> | undefined;
  const txHash = (verify?.tx_hash as string | undefined) ?? (verify?.error ? undefined : null);
  if (!txHash) {
    if (scenario === "unsafe" && verify?.error) {
      return {
        id: `demo-revert-${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
        modelCommitment: "—",
        publicInputs: (record.public_inputs as bigint[] | number[] | undefined)?.map(BigInt) ?? [],
        publicInputsLabel: formatPublicInputs(
          (record.public_inputs as bigint[] | number[] | undefined)?.map(BigInt) ?? [0n, 0n],
        ),
        status: "reverted",
        transactionHash: "0x" as `0x${string}`,
        blockNumber: 0,
        source: "demo",
      };
    }
    return null;
  }

  const publicInputsRaw = (record.public_inputs as number[] | undefined) ?? [];
  const publicInputs = publicInputsRaw.map((value) => BigInt(value));
  const verified = record.verified_decision as Record<string, unknown> | undefined;
  const status = (verify?.status as number | undefined) === 1 ? "executed" : "reverted";

  return {
    id: `demo-${txHash}`,
    timestamp: Number(verified?.timestamp ?? Math.floor(Date.now() / 1000)),
    modelCommitment: String(
      verified?.modelCommitment ??
        (record.model_commitment as string | undefined)?.replace(/^0x/, "") ??
        "unknown",
    ),
    publicInputs,
    publicInputsLabel: formatPublicInputs(publicInputs),
    status,
    transactionHash: txHash as `0x${string}`,
    blockNumber: Number(verify?.block_number ?? verified?.blockNumber ?? 0),
    source: "demo",
  };
}
