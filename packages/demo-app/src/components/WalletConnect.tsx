"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">{address}</p>
          <p className="text-xs text-zinc-500">{chain?.name ?? "Unknown network"}</p>
        </div>
        <button
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          onClick={() => disconnect()}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        disabled={isPending}
        onClick={() => connect({ connector: injected() })}
        type="button"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
      {error ? <p className="text-xs text-red-600">{error.message}</p> : null}
    </div>
  );
}
