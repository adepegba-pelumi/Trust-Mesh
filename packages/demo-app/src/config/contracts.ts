import type { Abi } from "viem";

/** Deployed TrustMeshVerifier — required for dashboard event indexing (see docs/deployments.md). */
export const trustMeshVerifierAddress = (process.env.NEXT_PUBLIC_TRUSTMESH_VERIFIER_ADDRESS ??
  "") as `0x${string}`;

/** Registered agent address shown in the dashboard. */
export const agentAddress = (process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "") as `0x${string}`;

/** Block to start scanning VerifiedDecision logs (TrustMeshVerifier deploy block). */
export const fromBlock = process.env.NEXT_PUBLIC_FROM_BLOCK
  ? BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK)
  : 0n;

export const contractsConfigured =
  trustMeshVerifierAddress.length === 42 && agentAddress.length === 42;

export const trustMeshVerifierAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "modelCommitment", type: "bytes32" },
      { internalType: "uint256", name: "commitmentField", type: "uint256" },
    ],
    name: "registerAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "agentCommitments",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "agentCommitmentFields",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "agent", type: "address" },
      { indexed: false, internalType: "bytes32", name: "modelCommitment", type: "bytes32" },
      { indexed: false, internalType: "uint256[]", name: "publicInputs", type: "uint256[]" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "VerifiedDecision",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "agent", type: "address" },
      { indexed: false, internalType: "bytes32", name: "modelCommitment", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "commitmentField", type: "uint256" },
    ],
    name: "AgentRegistered",
    type: "event",
  },
] as const satisfies Abi;
