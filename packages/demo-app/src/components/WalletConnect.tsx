"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "@wagmi/core";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-xs text-muted-foreground">{address}</p>
          <Badge className="mt-1" variant="secondary">
            {chain?.name ?? "Unknown network"}
          </Badge>
        </div>
        <Button onClick={() => disconnect()} size="sm" type="button" variant="outline">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button disabled={isPending} onClick={() => connect({ connector: injected() })} type="button">
        {isPending ? "Connecting…" : "Connect Wallet"}
      </Button>
      {error ? (
        <Alert className="max-w-xs py-2" variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
