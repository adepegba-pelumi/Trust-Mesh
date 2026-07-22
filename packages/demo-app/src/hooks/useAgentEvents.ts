"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePublicClient } from "wagmi";

import {
  agentAddress,
  fromBlock,
  trustMeshVerifierAbi,
  trustMeshVerifierAddress,
} from "@/config/contracts";
import { formatPublicInputs } from "@/lib/format";
import { logToAuditRow } from "@/lib/demoLog";
import type { AuditRow, PipelineStageId, PipelineState, StageTiming } from "@/types/demo";

const STAGE_ORDER: PipelineStageId[] = [
  "observing",
  "inferring",
  "proving",
  "verifying",
  "executing",
];

type DemoRunnerState = {
  pipelineState: PipelineState;
  stageTimings: Partial<Record<PipelineStageId, StageTiming>>;
  modelCommitment: string | null;
  isRunning: boolean;
  error: string | null;
  lastTxHash: string | null;
  demoAuditRows: AuditRow[];
};

const initialRunnerState: DemoRunnerState = {
  pipelineState: "idle",
  stageTimings: {},
  modelCommitment: null,
  isRunning: false,
  error: null,
  lastTxHash: null,
  demoAuditRows: [],
};

export function useDemoRunner() {
  const [state, setState] = useState<DemoRunnerState>(initialRunnerState);
  const eventSourceRef = useRef<EventSource | null>(null);

  const resetPipeline = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pipelineState: "idle",
      stageTimings: {},
      error: null,
      lastTxHash: null,
    }));
  }, []);

  const runDemo = useCallback(
    (unsafe = false) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setState((prev) => ({
        ...prev,
        isRunning: true,
        error: null,
        pipelineState: "observing",
        stageTimings: {},
        lastTxHash: null,
      }));

      const url = `/api/demo/run?unsafe=${unsafe ? "true" : "false"}&t=${Date.now()}`;
      const source = new EventSource(url);
      eventSourceRef.current = source;

      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as Record<string, unknown>;
          const type = event.type as string;

          if (type === "agent") {
            setState((prev) => ({
              ...prev,
              modelCommitment: String(event.modelCommitment),
            }));
            return;
          }

          if (type === "stage") {
            const stage = event.stage as PipelineStageId;
            if (event.status === "start") {
              setState((prev) => ({
                ...prev,
                pipelineState: stage,
              }));
            } else if (event.status === "complete") {
              setState((prev) => ({
                ...prev,
                stageTimings: {
                  ...prev.stageTimings,
                  [stage]: {
                    stage,
                    elapsedMs: Number(event.elapsedMs ?? 0),
                    data: event.data as Record<string, unknown> | undefined,
                  },
                },
              }));
            }
            return;
          }

          if (type === "tx_confirmed") {
            setState((prev) => ({
              ...prev,
              lastTxHash: String(event.tx_hash),
            }));
            return;
          }

          if (type === "complete") {
            const log = event.log as Record<string, unknown>;
            const scenario = unsafe ? "unsafe" : "happy";
            const auditRow = logToAuditRow(log, scenario);
            setState((prev) => ({
              ...prev,
              isRunning: false,
              pipelineState: "done",
              demoAuditRows: auditRow ? [auditRow, ...prev.demoAuditRows] : prev.demoAuditRows,
            }));
            source.close();
            eventSourceRef.current = null;
            return;
          }

          if (type === "error") {
            setState((prev) => ({
              ...prev,
              isRunning: false,
              pipelineState: "error",
              error: String(event.message),
            }));
            source.close();
            eventSourceRef.current = null;
          }
        } catch {
          // Ignore malformed chunks; stderr is logged server-side.
        }
      };

      source.onerror = () => {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          pipelineState: prev.pipelineState === "done" ? "done" : "error",
          error: prev.error ?? "Demo stream disconnected unexpectedly.",
        }));
        source.close();
        eventSourceRef.current = null;
      };
    },
    [],
  );

  useEffect(
    () => () => {
      eventSourceRef.current?.close();
    },
    [],
  );

  return {
    ...state,
    stageOrder: STAGE_ORDER,
    runDemo,
    resetPipeline,
  };
}

export function useAgentEvents(extraRows: AuditRow[] = []) {
  const publicClient = usePublicClient();
  const [chainRows, setChainRows] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient) return;
    const client = publicClient;

    let cancelled = false;

    async function loadHistorical() {
      setIsLoading(true);
      try {
        const logs = await client.getContractEvents({
          address: trustMeshVerifierAddress,
          abi: trustMeshVerifierAbi,
          eventName: "VerifiedDecision",
          fromBlock,
          toBlock: "latest",
        });

        if (cancelled) return;

        const rows: AuditRow[] = logs.map((log) => {
          const args = log.args as {
            agent: `0x${string}`;
            modelCommitment: `0x${string}`;
            publicInputs: readonly bigint[];
            timestamp: bigint;
          };

          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            timestamp: Number(args.timestamp),
            modelCommitment: args.modelCommitment,
            publicInputs: args.publicInputs,
            publicInputsLabel: formatPublicInputs(args.publicInputs),
            status: "executed" as const,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            source: "chain" as const,
          };
        });

        rows.sort((a, b) => b.timestamp - a.timestamp);
        setChainRows(rows);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadHistorical();

    const unwatch = client.watchContractEvent({
      address: trustMeshVerifierAddress,
      abi: trustMeshVerifierAbi,
      eventName: "VerifiedDecision",
      onLogs: (logs) => {
        setChainRows((prev) => {
          const merged = [...prev];
          for (const log of logs) {
            const args = log.args;
            if (!args?.modelCommitment || !args.publicInputs || args.timestamp === undefined) {
              continue;
            }
            const row: AuditRow = {
              id: `${log.transactionHash}-${log.logIndex}`,
              timestamp: Number(args.timestamp),
              modelCommitment: args.modelCommitment,
              publicInputs: args.publicInputs,
              publicInputsLabel: formatPublicInputs(args.publicInputs),
              status: "executed",
              transactionHash: log.transactionHash,
              blockNumber: Number(log.blockNumber),
              source: "chain",
            };
            if (!merged.some((existing) => existing.id === row.id)) {
              merged.unshift(row);
            }
          }
          merged.sort((a, b) => b.timestamp - a.timestamp);
          return merged;
        });
      },
    });

    return () => {
      cancelled = true;
      unwatch();
    };
  }, [publicClient]);

  const rows = useMemo(() => {
    const merged = [...extraRows, ...chainRows];
    const seen = new Set<string>();
    return merged.filter((row) => {
      const key = row.transactionHash !== "0x" ? row.transactionHash : row.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [chainRows, extraRows]);

  const lastDecision = rows[0] ?? null;

  return { rows, lastDecision, isLoading };
}

export function useAgentStatus(modelCommitmentFromDemo: string | null) {
  const publicClient = usePublicClient();
  const [onChainCommitment, setOnChainCommitment] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;

    void publicClient
      .readContract({
        address: trustMeshVerifierAddress,
        abi: trustMeshVerifierAbi,
        functionName: "agentCommitments",
        args: [agentAddress],
      })
      .then((value) => {
        if (value && value !== "0x" + "0".repeat(64)) {
          setOnChainCommitment(value);
        }
      })
      .catch(() => {
        // Non-fatal for dashboard display.
      });
  }, [publicClient, modelCommitmentFromDemo]);

  return {
    agentAddress,
    modelCommitment: modelCommitmentFromDemo ?? onChainCommitment,
  };
}
