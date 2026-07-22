export type PipelineStageId =
  | "observing"
  | "inferring"
  | "proving"
  | "verifying"
  | "executing";

export type PipelineState =
  | "idle"
  | PipelineStageId
  | "done"
  | "error";

export type StageTiming = {
  stage: PipelineStageId;
  elapsedMs: number;
  data?: Record<string, unknown>;
};

export type StreamEvent =
  | { type: "connected"; chainId: number; agent: string; verifier: string; scenario: string }
  | { type: "agent"; modelCommitment: string; commitmentSeconds?: number }
  | { type: "stage"; stage: PipelineStageId; status: "start" | "complete"; elapsedMs?: number; data?: Record<string, unknown> }
  | { type: "tx_submitted"; label: string; txHash: string }
  | { type: "tx_confirmed"; label: string; tx_hash: string; status: number; block_number: number; gas_used: number }
  | { type: "complete"; log: Record<string, unknown> }
  | { type: "error"; message: string };

export type AuditRowStatus = "executed" | "reverted";

export type AuditRow = {
  id: string;
  timestamp: number;
  modelCommitment: string;
  publicInputs: readonly bigint[];
  publicInputsLabel: string;
  status: AuditRowStatus;
  transactionHash: `0x${string}`;
  blockNumber: number;
  source: "chain" | "demo";
};
