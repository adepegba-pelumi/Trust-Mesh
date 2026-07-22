import { injected } from "@wagmi/core";
import { sepolia } from "viem/chains";
import { http, createConfig } from "wagmi";

export const chains = [sepolia] as const;
export const appName = "TrustMesh";

const rpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

/** Shared injected connector — must be registered on the config (not recreated per click). */
export const injectedConnector = injected({
  shimDisconnect: true,
});

export const wagmiConfig = createConfig({
  chains,
  connectors: [injectedConnector],
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

export { sepoliaExplorerAddress, sepoliaExplorerTx } from "@/config/network";
