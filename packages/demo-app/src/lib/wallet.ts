"use client";

type EthereumProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isTrust?: boolean;
  isCoinbaseWallet?: boolean;
};

function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

/** True for phone/tablet browsers (not desktop). */
export function isMobileBrowser(userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/** MetaMask Mobile in-app browser injects `window.ethereum`. */
export function isMetaMaskInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getEthereumProvider()?.isMetaMask && isMobileBrowser());
}

export function hasInjectedWallet(): boolean {
  return Boolean(getEthereumProvider()?.request);
}

/** Wait briefly for an injected provider (MetaMask extension loads async on desktop). */
export async function waitForEthereumProvider(timeoutMs = 4_000): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  if (hasInjectedWallet()) {
    return true;
  }

  // MetaMask in-app browser already injects synchronously; skip long wait on mobile.
  if (isMobileBrowser() && !hasInjectedWallet()) {
    return false;
  }

  return new Promise((resolve) => {
    const started = Date.now();

    const finish = (found: boolean) => {
      window.removeEventListener("ethereum#initialized", onInjected);
      clearInterval(poll);
      resolve(found);
    };

    const onInjected = () => {
      if (hasInjectedWallet()) {
        finish(true);
      }
    };

    window.addEventListener("ethereum#initialized", onInjected);

    const poll = window.setInterval(() => {
      if (hasInjectedWallet()) {
        finish(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        finish(false);
      }
    }, 100);
  });
}

export function isWalletConnectConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim());
}

/** Hint shown below the connect button before the user connects. */
export function connectWalletHint(hasInjected: boolean, isMobile: boolean): string | null {
  if (hasInjected) return null;

  if (isMobile) {
    if (isWalletConnectConfigured()) {
      return "Tap Connect Wallet to choose MetaMask, Trust Wallet, or another mobile wallet.";
    }
    return "Tap Connect Wallet, or open this page in the MetaMask app browser.";
  }

  return "Install a browser wallet extension (MetaMask, Rabby, Coinbase Wallet), then refresh.";
}

export function desktopWalletUnavailableMessage(): string {
  return (
    "No browser wallet found. Install MetaMask, Rabby, or Coinbase Wallet as a browser extension, " +
    "then refresh this page."
  );
}

export function mobileWalletUnavailableMessage(): string {
  if (isWalletConnectConfigured()) {
    return "Could not open a wallet connection. Try again or open this page in your wallet app's browser.";
  }
  return (
    "No wallet detected. Open this page in the MetaMask app browser, or configure WalletConnect for mobile wallets."
  );
}

export function formatConnectError(error: Error): string {
  const message = error.message ?? "";
  const lower = message.toLowerCase();
  const name = error.name ?? "";

  if (
    name === "UserRejectedRequestError" ||
    lower.includes("rejected") ||
    lower.includes("denied") ||
    lower.includes("user refused")
  ) {
    return "Connection request was rejected.";
  }

  if (lower.includes("chain") || lower.includes("network") || lower.includes("unsupported chain")) {
    return "Unsupported network. Switch your wallet to Sepolia and try again.";
  }

  if (lower.includes("project id") || lower.includes("project_id") || lower.includes("projectid")) {
    return "WalletConnect is not configured on this deployment.";
  }

  if (lower.includes("session") && lower.includes("expired")) {
    return "Wallet session expired. Please connect again.";
  }

  if (lower.includes("provider not found") || lower.includes("no provider")) {
    return isMobileBrowser()
      ? mobileWalletUnavailableMessage()
      : desktopWalletUnavailableMessage();
  }

  return message || "Could not connect wallet. Please try again.";
}

/** Deep link to open the current dapp inside MetaMask Mobile. */
export function metaMaskMobileDappLink(): string | null {
  if (typeof window === "undefined") return null;
  const url = `${window.location.host}${window.location.pathname}`;
  return `https://metamask.app.link/dapp/${encodeURIComponent(url)}`;
}
