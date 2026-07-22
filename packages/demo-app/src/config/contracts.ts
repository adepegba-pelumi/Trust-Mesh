import type { Abi } from "viem";

export const trustMeshVerifierAddress = (process.env.NEXT_PUBLIC_TRUSTMESH_VERIFIER_ADDRESS ??
  "0x4d871E1Dd2193769b4634a27582be18A2962b38c") as `0x${string}`;

export const agentAddress = (process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994") as `0x${string}`;

export const fromBlock = BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK ?? "11322690");

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
