import { injected, walletConnect } from "@wagmi/connectors";
import { sepolia } from "viem/chains";
import { http, createConfig } from "wagmi";

export const chains = [sepolia] as const;
export const appName = "TrustMesh";

const rpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";

/** Shared injected connector — desktop extensions & in-app browser wallets. */
export const injectedConnector = injected({
  shimDisconnect: true,
});

/** WalletConnect / Reown — mobile wallets & desktop QR fallback. */
export const walletConnectConnector = walletConnectProjectId
  ? walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: appName,
        description: "Verifiable AI agent infrastructure on Sepolia",
        url: appUrl,
        icons: [`${appUrl}/favicon.ico`],
      },
      showQrModal: true,
    })
  : null;

export const wagmiConfig = createConfig({
  chains,
  connectors: walletConnectConnector
    ? [injectedConnector, walletConnectConnector]
    : [injectedConnector],
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

export { sepoliaExplorerAddress, sepoliaExplorerTx } from "@/config/network";
