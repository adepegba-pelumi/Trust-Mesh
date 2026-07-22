import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";

export const chains = [sepolia] as const;
export const appName = "TrustMesh";

const rpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains,
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

export const sepoliaExplorerTx = (hash: string) =>
  `https://sepolia.etherscan.io/tx/${hash}`;

export const sepoliaExplorerAddress = (address: string) =>
  `https://sepolia.etherscan.io/address/${address}`;
