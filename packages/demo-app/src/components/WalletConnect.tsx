"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  connectWalletHint,
  formatConnectError,
  isMobileBrowser,
  isWalletConnectConfigured,
  metaMaskMobileDappLink,
  waitForEthereumProvider,
} from "@/lib/wallet";

function pickConnector(
  connectors: ReturnType<typeof useConnectors>,
  preferInjected: boolean,
) {
  const injected = connectors.find((c) => c.type === "injected");
  const wc = connectors.find((c) => c.type === "walletConnect");

  if (preferInjected && injected) return injected;
  if (wc) return wc;
  return injected ?? connectors[0] ?? null;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const connectors = useConnectors();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [localError, setLocalError] = useState<string | null>(null);
  const [hasInjected, setHasInjected] = useState<boolean | null>(null);

  const isMobile = useMemo(() => isMobileBrowser(), []);
  const hint = connectWalletHint(hasInjected === true, isMobile);
  const metamaskLink = isMobile && hasInjected === false ? metaMaskMobileDappLink() : null;

  useEffect(() => {
    let cancelled = false;
    void waitForEthereumProvider(isMobile ? 500 : 4_000).then((detected) => {
      if (!cancelled) {
        setHasInjected(detected);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  const handleConnect = async () => {
    setLocalError(null);

    const injectedAvailable = await waitForEthereumProvider(isMobile ? 500 : 4_000);
    setHasInjected(injectedAvailable);

    const connector = pickConnector(connectors, injectedAvailable);
    if (!connector) {
      setLocalError(
        isMobile
          ? "No wallet connection method is available."
          : "No wallet connectors are configured.",
      );
      return;
    }

    if (!injectedAvailable && connector.type !== "walletConnect") {
      if (!isWalletConnectConfigured()) {
        setLocalError(
          isMobile
            ? "Open this page in your wallet app's browser, or set up WalletConnect for mobile support."
            : "No browser wallet detected. Install a wallet extension or configure WalletConnect.",
        );
        return;
      }
    }

    connect({ connector });
  };

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-[#EAEAEC] px-2.5 py-1 font-mono text-xs text-[#6E6E76]">
          {shortenAddress(address)}
        </span>
        <Badge variant="network">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden />
          {chain?.name ?? "Unknown"}
        </Badge>
        <Button onClick={() => disconnect()} size="sm" type="button" variant="outline">
          Disconnect
        </Button>
      </div>
    );
  }

  const displayError = localError ?? (error ? formatConnectError(error) : null);

  return (
    <div className="flex flex-col items-end gap-2">
      {hint ? <p className="max-w-xs text-right text-xs text-[#6E6E76]">{hint}</p> : null}
      {metamaskLink && !isWalletConnectConfigured() ? (
        <a
          className="max-w-xs text-right text-xs text-[#111111] hover:underline"
          href={metamaskLink}
          rel="noreferrer"
        >
          Open in MetaMask app
        </a>
      ) : null}
      <Button
        disabled={isPending}
        onClick={() => void handleConnect()}
        size="sm"
        type="button"
        variant="outline"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </Button>
      {displayError ? (
        <Alert className="max-w-xs py-2" variant="destructive">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
