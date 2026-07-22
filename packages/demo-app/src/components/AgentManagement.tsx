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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [commitmentField, setCommitmentField] = useState<string | null>(null);

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
        commitmentField?: string;
        error?: string;
      };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Commitment generation failed");
      }
      setModelCommitment(payload.modelCommitment ?? null);
      setCommitmentField(payload.commitmentField ?? null);
    } catch (error) {
      setCommitmentError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setCommitmentLoading(false);
    }
  };

  const registerAgent = () => {
    const commitment = normalizeCommitment(manualCommitment || modelCommitment || "");
    const fieldText = commitmentField?.trim();
    if (commitment === `0x${"0".repeat(64)}`) {
      setCommitmentError("Generate or paste a model commitment first.");
      return;
    }
    if (!fieldText || fieldText === "0") {
      setCommitmentError("Generate a commitment to obtain the Halo2 commitment field.");
      return;
    }
    reset();
    writeContract({
      address: trustMeshVerifierAddress,
      abi: trustMeshVerifierAbi,
      functionName: "registerAgent",
      args: [commitment as `0x${string}`, BigInt(fieldText)],
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
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Connect a wallet</CardTitle>
          <CardDescription>
            Use the Connect Wallet button in the header to register an agent on Sepolia.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isSepolia) {
    return (
      <Alert>
        <AlertDescription>
          Switch your wallet to Sepolia (chain ID {sepolia.id}) to register agents.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent status</CardTitle>
        </CardHeader>
        <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Connected wallet</dt>
            <dd className="mt-1 font-mono text-sm">{address}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Registration</dt>
            <dd className="mt-1 text-sm">
              {isRegistered ? (
                <Badge variant="success">Registered</Badge>
              ) : (
                <span className="text-muted-foreground">Not registered</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Network</dt>
            <dd className="mt-1 text-sm">Sepolia</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Verifier</dt>
            <dd className="mt-1 font-mono text-sm">{truncateHash(trustMeshVerifierAddress)}</dd>
          </div>
        </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Register agent</CardTitle>
          <CardDescription>
            Generate a KZG model commitment via the prover, or paste an existing commitment hex.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button disabled={commitmentLoading} onClick={() => void generateCommitment()} type="button">
            {commitmentLoading ? "Generating…" : "Generate model commitment"}
          </Button>
        </div>

        {modelCommitment ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Generated: {formatModelCommitment(modelCommitment)}
          </p>
        ) : null}
        {commitmentField ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Commitment field: {commitmentField}
          </p>
        ) : null}

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Commitment (0x…)
          <Input
            className="mt-2 font-mono"
            onChange={(event) => setManualCommitment(event.target.value)}
            placeholder="0x… or generate above"
            value={manualCommitment || modelCommitment || ""}
          />
        </label>

        {commitmentError ? (
          <Alert className="mt-3" variant="destructive">
            <AlertDescription>{commitmentError}</AlertDescription>
          </Alert>
        ) : null}
        {writeError ? (
          <Alert className="mt-3" variant="destructive">
            <AlertDescription>{writeError.message}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="mt-4"
          disabled={isPending || isConfirming || isRegistered}
          onClick={registerAgent}
          type="button"
        >
          {isPending || isConfirming
            ? "Submitting…"
            : isRegistered
              ? "Already registered"
              : "Submit registerAgent"}
        </Button>

        {txHash ? (
          <p className="mt-3 text-sm">
            Transaction:{" "}
            <a
              className="font-mono text-primary hover:underline"
              href={sepoliaExplorerTx(txHash)}
              rel="noreferrer"
              target="_blank"
            >
              {truncateHash(txHash)}
            </a>
            {isError ? " (reverted)" : isSuccess ? " (confirmed)" : " (pending)"}
          </p>
        ) : null}
        </CardContent>
      </Card>

      {isRegistered ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Registered agent details</CardTitle>
            <Button onClick={() => void copyCommitment()} size="sm" type="button" variant="outline">
              {copied ? "Copied" : "Copy commitment"}
            </Button>
          </CardHeader>
          <CardContent>
          <dl className="grid gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Model commitment</dt>
              <dd className="mt-1 font-mono text-sm">
                {formatModelCommitment(normalizeCommitment(onChainCommitment!))}
              </dd>
            </div>
            {registrationEvent ? (
              <>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Registered at</dt>
                  <dd className="mt-1 text-sm">{formatTimestamp(registrationEvent.timestamp)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Block</dt>
                  <dd className="mt-1 font-mono text-sm">
                    {registrationEvent.blockNumber.toString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Registration tx
                  </dt>
                  <dd className="mt-1">
                    <a
                      className="font-mono text-sm text-primary hover:underline"
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
