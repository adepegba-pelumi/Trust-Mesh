"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { outlineButton } from "@/components/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { injectedConnector } from "@/config/web3";
import { waitForEthereumProvider, walletUnavailableMessage } from "@/lib/wallet";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [localError, setLocalError] = useState<string | null>(null);
  const [walletDetected, setWalletDetected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void waitForEthereumProvider().then((detected) => {
      if (!cancelled) {
        setWalletDetected(detected);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConnect = async () => {
    setLocalError(null);
    const detected = await waitForEthereumProvider();
    setWalletDetected(detected);
    if (!detected) {
      setLocalError(walletUnavailableMessage());
      return;
    }
    connect({ connector: injectedConnector });
  };

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-xs text-zinc-400">{address}</p>
          <Badge className="mt-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400" variant="secondary">
            {chain?.name ?? "Unknown network"}
          </Badge>
        </div>
        <Button className={outlineButton} onClick={() => disconnect()} size="sm" type="button" variant="outline">
          Disconnect
        </Button>
      </div>
    );
  }

  const displayError = localError ?? error?.message;

  return (
    <div className="flex flex-col items-end gap-2">
      {walletDetected === false ? (
        <p className="max-w-xs text-right text-xs text-zinc-500">
          Open this app in a browser with MetaMask installed, then retry.
        </p>
      ) : null}
      <Button disabled={isPending} onClick={() => void handleConnect()} type="button">
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
