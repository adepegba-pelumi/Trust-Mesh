"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { trustMeshVerifierAbi, trustMeshVerifierAddress } from "@/config/contracts";
import { sepoliaExplorerTx } from "@/config/web3";
import {
  formatModelCommitment,
  formatTimestamp,
  normalizeCommitment,
  truncateHash,
} from "@/lib/format";

type RegistrationEvent = {
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  timestamp: number;
};

export function AgentManagement() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [modelCommitment, setModelCommitment] = useState<string | null>(null);
  const [commitmentLoading, setCommitmentLoading] = useState(false);
  const [commitmentError, setCommitmentError] = useState<string | null>(null);
  const [onChainCommitment, setOnChainCommitment] = useState<string | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<RegistrationEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualCommitment, setManualCommitment] = useState("");

  const isSepolia = chainId === sepolia.id;
  const isRegistered =
    onChainCommitment !== null && onChainCommitment !== `0x${"0".repeat(64)}`;

  const refreshOnChainStatus = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const value = await publicClient.readContract({
        address: trustMeshVerifierAddress,
        abi: trustMeshVerifierAbi,
        functionName: "agentCommitments",
        args: [address],
      });
      if (value && value !== `0x${"0".repeat(64)}`) {
        setOnChainCommitment(value);
      } else {
        setOnChainCommitment(null);
      }

      const logs = await publicClient.getContractEvents({
        address: trustMeshVerifierAddress,
        abi: trustMeshVerifierAbi,
        eventName: "AgentRegistered",
        args: { agent: address },
        fromBlock: 0n,
        toBlock: "latest",
      });
      const latest = logs.at(-1);
      if (latest?.blockNumber && latest.transactionHash) {
        const block = await publicClient.getBlock({ blockNumber: latest.blockNumber });
        setRegistrationEvent({
          blockNumber: latest.blockNumber,
          transactionHash: latest.transactionHash,
          timestamp: Number(block.timestamp),
        });
      }
    } catch {
      // Non-fatal — RPC may be unavailable.
    }
  }, [address, publicClient]);

  useEffect(() => {
    void refreshOnChainStatus();
  }, [refreshOnChainStatus, isSuccess]);

  const generateCommitment = async () => {
    setCommitmentLoading(true);
    setCommitmentError(null);
    try {
      const response = await fetch("/api/agents/commitment");
      const payload = (await response.json()) as {
        modelCommitment?: string;
        error?: string;
      };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Commitment generation failed");
      }
      setModelCommitment(payload.modelCommitment ?? null);
    } catch (error) {
      setCommitmentError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setCommitmentLoading(false);
    }
  };

  const registerAgent = () => {
    const commitment = normalizeCommitment(manualCommitment || modelCommitment || "");
    if (commitment === `0x${"0".repeat(64)}`) {
      setCommitmentError("Generate or paste a model commitment first.");
      return;
    }
    reset();
    writeContract({
      address: trustMeshVerifierAddress,
      abi: trustMeshVerifierAbi,
      functionName: "registerAgent",
      args: [commitment as `0x${string}`],
    });
  };

  const copyCommitment = async () => {
    const value = onChainCommitment ?? modelCommitment;
    if (!value) return;
    await navigator.clipboard.writeText(normalizeCommitment(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Connect a wallet</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Use the Connect Wallet button in the header to register an agent on Sepolia.
        </p>
      </section>
    );
  }

  if (!isSepolia) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/40">
        <h2 className="font-semibold text-amber-900 dark:text-amber-100">Unsupported network</h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
          Switch your wallet to Sepolia (chain ID {sepolia.id}) to register agents.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Agent status</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Connected wallet</dt>
            <dd className="mt-1 font-mono text-sm">{address}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Registration</dt>
            <dd className="mt-1 text-sm">
              {isRegistered ? (
                <span className="text-emerald-600 dark:text-emerald-400">Registered</span>
              ) : (
                <span className="text-zinc-500">Not registered</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Network</dt>
            <dd className="mt-1 text-sm">Sepolia</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Verifier</dt>
            <dd className="mt-1 font-mono text-sm">{truncateHash(trustMeshVerifierAddress)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Register agent</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Generate a KZG model commitment via the prover, or paste an existing commitment hex.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            disabled={commitmentLoading}
            onClick={() => void generateCommitment()}
            type="button"
          >
            {commitmentLoading ? "Generating…" : "Generate model commitment"}
          </button>
        </div>

        {modelCommitment ? (
          <p className="mt-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
            Generated: {formatModelCommitment(modelCommitment)}
          </p>
        ) : null}

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Commitment (0x…)
          <input
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            onChange={(event) => setManualCommitment(event.target.value)}
            placeholder="0x… or generate above"
            value={manualCommitment || modelCommitment || ""}
          />
        </label>

        {commitmentError ? <p className="mt-2 text-sm text-red-600">{commitmentError}</p> : null}
        {writeError ? <p className="mt-2 text-sm text-red-600">{writeError.message}</p> : null}

        <button
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          disabled={isPending || isConfirming || isRegistered}
          onClick={registerAgent}
          type="button"
        >
          {isPending || isConfirming
            ? "Submitting…"
            : isRegistered
              ? "Already registered"
              : "Submit registerAgent"}
        </button>

        {txHash ? (
          <p className="mt-3 text-sm">
            Transaction:{" "}
            <a
              className="font-mono text-sky-600 hover:underline dark:text-sky-400"
              href={sepoliaExplorerTx(txHash)}
              rel="noreferrer"
              target="_blank"
            >
              {truncateHash(txHash)}
            </a>
            {isError ? " (reverted)" : isSuccess ? " (confirmed)" : " (pending)"}
          </p>
        ) : null}
      </section>

      {isRegistered ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Registered agent details
            </h2>
            <button
              className="rounded-lg border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
              onClick={() => void copyCommitment()}
              type="button"
            >
              {copied ? "Copied" : "Copy commitment"}
            </button>
          </div>
          <dl className="mt-4 grid gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Model commitment</dt>
              <dd className="mt-1 font-mono text-sm">
                {formatModelCommitment(normalizeCommitment(onChainCommitment!))}
              </dd>
            </div>
            {registrationEvent ? (
              <>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">Registered at</dt>
                  <dd className="mt-1 text-sm">{formatTimestamp(registrationEvent.timestamp)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">Block</dt>
                  <dd className="mt-1 font-mono text-sm">
                    {registrationEvent.blockNumber.toString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">
                    Registration tx
                  </dt>
                  <dd className="mt-1">
                    <a
                      className="font-mono text-sm text-sky-600 hover:underline dark:text-sky-400"
                      href={sepoliaExplorerTx(registrationEvent.transactionHash)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {truncateHash(registrationEvent.transactionHash)}
                    </a>
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
