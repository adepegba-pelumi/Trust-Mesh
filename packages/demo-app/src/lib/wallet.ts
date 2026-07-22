"use client";

type EthereumProvider = {
  request?: (args: { method: string }) => Promise<unknown>;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/** Wait for a browser wallet to inject `window.ethereum` (MetaMask loads asynchronously). */
export async function waitForEthereumProvider(timeoutMs = 4_000): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.ethereum?.request) {
    return true;
  }

  return new Promise((resolve) => {
    const started = Date.now();

    const finish = (found: boolean) => {
      window.removeEventListener("ethereum#initialized", onInjected);
      clearInterval(poll);
      resolve(found);
    };

    const onInjected = () => {
      if (window.ethereum?.request) {
        finish(true);
      }
    };

    window.addEventListener("ethereum#initialized", onInjected);

    const poll = window.setInterval(() => {
      if (window.ethereum?.request) {
        finish(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        finish(false);
      }
    }, 100);
  });
}

export function walletUnavailableMessage(): string {
  return (
    "No browser wallet detected. Install MetaMask (or another Web3 extension), " +
    "enable it for this site, and use a desktop browser—not an in-app browser."
  );
}
