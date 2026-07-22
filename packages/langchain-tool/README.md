# TrustMesh LangChain Tool

LangChain-compatible tooling that lets agents verify DeFi actions through TrustMesh:
generate a Stage 2 safety proof, submit it to the on-chain `TrustMeshVerifier`, and
return a structured JSON result the agent can reason over in its next step.

## Installation

From this directory (standalone — no monorepo context required beyond the sibling prover package):

```bash
cd packages/langchain-tool
uv sync
```

For development and tests:

```bash
uv sync --dev
uv run pytest
```

## Environment

Copy the example env file and fill in Sepolia credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `SEPOLIA_RPC_URL` | JSON-RPC endpoint (alias: `TRUSTMESH_RPC_URL`) |
| `DEPLOYER_PRIVATE_KEY` | Agent EOA private key (alias: `TRUSTMESH_AGENT_PRIVATE_KEY`) |
| `TRUSTMESH_VERIFIER_ADDRESS` | Deployed `TrustMeshVerifier` contract |
| `TRUSTMESH_WITNESS_PATH` | Halo2 witness JSON for production proving |
| `TRUSTMESH_PROVE_BIN` | Path to `trustmesh-prove` (optional if on `PATH`) |
| `TRUSTMESH_PROVING_KEYS` | Directory with Halo2 proving keys |

The agent address derived from the private key must register via
`registerAgent(modelCommitment, commitmentField)` on the verifier contract.

## Tool reference

### `trustmesh_verify_defi_action`

| Property | Value |
|----------|-------|
| **Class** | `TrustMeshVerificationTool` |
| **Name** | `trustmesh_verify_defi_action` (snake_case per LangChain conventions) |
| **Base** | `langchain_core.tools.BaseTool` |
| **Input schema** | `DeFiActionInput` (Pydantic) |
| **Return type** | JSON string → `TrustMeshVerificationResult` |

#### Input fields

| Field | Type | Description |
|-------|------|-------------|
| `target_contract` | `str` | DeFi protocol contract address |
| `action_type` | `"swap" \| "supply" \| "withdraw" \| "transfer"` | Intended action category |
| `amount_wei` | `int` | Native-token value for the payload |
| `pool_liquidity_wei` | `int` | Public input 0 — pool liquidity |
| `post_trade_concentration_bps` | `int` | Public input 1 — concentration (0–10000 bps) |
| `calldata` | `str` | Optional hex calldata (default `0x`) |

#### Output fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | On-chain verification succeeded |
| `reverted` | `bool` | Transaction or pre-check failed |
| `transaction_hash` | `str \| null` | Broadcast tx hash |
| `model_commitment` | `str \| null` | Agent's registered KZG commitment |
| `public_inputs` | `list[int]` | Bound proof inputs |
| `audit_event` | `object \| null` | Parsed `VerifiedDecision` event |
| `proof_generation_seconds` | `float \| null` | Prover latency |
| `error_message` | `str \| null` | Failure reason |

## Quick start — direct tool call (no LLM)

This works offline for proof generation; on-chain submission requires RPC credentials.

```python
from dotenv import load_dotenv

from trustmesh_langchain import DeFiActionInput, TrustMeshVerificationTool

load_dotenv()

tool = TrustMeshVerificationTool.from_env()

action = DeFiActionInput(
    target_contract="0x4d871E1Dd2193769b4634a27582be18A2962b38c",
    action_type="swap",
    amount_wei=10**17,
    pool_liquidity_wei=2_000 * 10**18,
    post_trade_concentration_bps=2_500,
)

# Parsed Python object
result = tool.invoke_structured(action)
print(result.success, result.transaction_hash)

# LangChain-compatible JSON string (what agents receive)
print(tool.run(action.model_dump()))
```

## Minimal LangChain agent example

Install an LLM provider (example uses OpenAI):

```bash
uv add langchain-openai
export OPENAI_API_KEY=sk-...
```

```python
import json
import os

from dotenv import load_dotenv
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

from trustmesh_langchain import TrustMeshVerificationTool

load_dotenv()

tool = TrustMeshVerificationTool.from_env()
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a DeFi portfolio agent. Before executing any trade, you MUST call "
            "trustmesh_verify_defi_action with realistic market data. "
            "If verification fails (reverted=true), explain the safety violation and do not proceed.",
        ),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ]
)

agent = create_tool_calling_agent(llm, [tool], prompt)
executor = AgentExecutor(agent=agent, tools=[tool], verbose=True)

response = executor.invoke(
    {
        "input": (
            "Verify a swap of 0.1 ETH on target 0x4d871E1Dd2193769b4634a27582be18A2962b38c "
            "assuming pool liquidity of 2000 ETH and post-trade concentration of 25%."
        )
    }
)

print(response["output"])

# Inspect the raw tool result from intermediate steps when debugging
for step in response.get("intermediate_steps", []):
    observation = step[1]
    if isinstance(observation, str) and observation.startswith("{"):
        parsed = json.loads(observation)
        print("verification:", parsed.get("success"), parsed.get("transaction_hash"))
```

## Testing without Sepolia

Unit tests mock the contract layer — no RPC or live chain access:

```bash
uv run pytest
```

CI runs the same command in `.github/workflows/ci.yml`.

## Architecture

```
LangChain Agent
      │
      ▼
TrustMeshVerificationTool._run()
      │
      ├─► agentCommitments(agent)     # Stage 1 reference (on-chain)
      ├─► load witness (`TRUSTMESH_WITNESS_PATH`)
      ├─► build_proof_bundle(...)     # Halo2 prover + KZG recompute + local verify
      └─► verifyAndExecute(...)       # Stage 3 TrustMeshVerifier
              │
              ▼
      TrustMeshVerificationResult (JSON)
```

## Related packages

| Package | Role |
|---------|------|
| [`trustmesh-prover`](../prover) | KZG commitments + production Halo2 proofs |
| [`contracts`](../contracts) | Solidity verifier and safety rules |
| [`demo-app`](../demo-app) | Next.js dashboard for the full pipeline |

See the root [README](../../README.md) for the full TrustMesh architecture.
