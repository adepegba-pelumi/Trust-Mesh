import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Avoid @wagmi/connectors barrel — it eagerly loads Base Account and breaks the build.
      "@wagmi/connectors": path.join(__dirname, "src/lib/wagmi-connectors-shim.ts"),
      "wagmi/connectors": path.join(__dirname, "src/lib/wagmi-connectors-shim.ts"),
      "wagmi-wallet-connect-connector": path.join(
        __dirname,
        "node_modules/@wagmi/connectors/dist/esm/walletConnect.js",
      ),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
