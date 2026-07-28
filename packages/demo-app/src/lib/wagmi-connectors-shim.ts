/**
 * Minimal @wagmi/connectors re-export.
 * The package barrel loads every connector (Base Account, Coinbase, etc.) and
 * breaks Next.js builds via optional deps like @x402/evm. We only need walletConnect.
 */
export { injected } from "@wagmi/core";
export { walletConnect } from "wagmi-wallet-connect-connector";
