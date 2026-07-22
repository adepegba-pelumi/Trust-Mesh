"""Minimal TrustMeshVerifier ABI for LangChain tool integration."""

# ruff: noqa: E501 — ABI JSON entries are intentionally verbose

TRUSTMESH_VERIFIER_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "modelCommitment", "type": "bytes32"}],
        "name": "registerAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "agent", "type": "address"},
            {"internalType": "bytes", "name": "proof", "type": "bytes"},
            {"internalType": "uint256[]", "name": "publicInputs", "type": "uint256[]"},
            {"internalType": "bytes", "name": "transactionPayload", "type": "bytes"},
        ],
        "name": "verifyAndExecute",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "agentCommitments",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "agent", "type": "address"},
            {
                "indexed": False,
                "internalType": "bytes32",
                "name": "modelCommitment",
                "type": "bytes32",
            },
            {
                "indexed": False,
                "internalType": "uint256[]",
                "name": "publicInputs",
                "type": "uint256[]",
            },
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
        ],
        "name": "VerifiedDecision",
        "type": "event",
    },
]
