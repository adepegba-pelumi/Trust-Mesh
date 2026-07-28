# Commitment binding (Stage 6.8)

## Verification flow

1. **Stage 1 (off-chain KZG, BLS12-381)** — Agent quantizes weights and computes `modelCommitment = kzg_commit(weights)`.
2. **Witness (private)** — Prover supplies quantized weights, features, and `model_commitment` bytes32.
3. **Python KZG recompute (pre-prove)** — `verify_witness_kzg_commitment()` quantizes witness weights, recomputes the Stage 1 KZG digest, and rejects proving if it differs from the registered commitment or witness bytes.
4. **Circuit public input [2]** — `Fr = kzg_digest_to_field(model_commitment) + hash_weights(witness)`.
5. **Halo2 proof** — Binds all three public instances; local `verify_proof()` checks supplied public inputs match witness-derived instances before CLI verify.
6. **Solidity registration** — `registerAgent(modelCommitment, commitmentField)` stores the exact Halo2 field expected for this agent.
7. **Solidity verify** — `Halo2PlonkVerifier.verifyProof()` checks the SNARK; `CommitmentBinding.verifyExactBinding()` requires `publicInputs[2] == agentCommitmentFields[agent]`.

## Cryptographically enforced

| Guarantee | Mechanism |
|-----------|-----------|
| Inference arithmetic | Halo2 circuit constraints (mul/add/ReLU) |
| Public liquidity / concentration / commitment field | Halo2 instance columns |
| Proof integrity | Halo2 PLONK verification (Rust CLI + generated Solidity verifier) |
| Witness weights ↔ registered KZG digest | Python KZG recompute before proving |
| Proof ↔ public inputs | Local verification compares witness-derived instances to supplied inputs |

## Operational trust (not fully on-chain)

| Assumption | Notes |
|------------|-------|
| Agent registers correct `commitmentField` | Must match witness-derived field at registration time |
| Stage 1 SRS / trusted setup | Separate BLS12-381 KZG setup vs BN254 Halo2 setup |
| No in-circuit KZG opening | On-chain binding is field equality, not KZG pairing verify |
| Oracle liquidity / market features | Liquidity public input is not constrained against witness liquidity |
| Off-circuit softmax for concentration | Native computation must match circuit binding |
| `halo2-solidity-verifier` codegen | Treat as unaudited operational dependency until independently reviewed |

## Failure modes

| Tamper | Result |
|--------|--------|
| Different weights | KZG recompute fails in Python **or** different public [2] → proof invalid |
| Wrong commitment bytes in witness | `KzgCommitmentMismatch` before proving |
| Wrong public [2] on-chain | `CommitmentBindingFailed` or Halo2 verify fails |
| Wrong public [0]/[1] vs witness | Local `verify_proof()` fails |
| Fixture proofs in production | Blocked unless `TRUSTMESH_ALLOW_FIXTURES=true` (tests only) |

## Field map (Rust / Solidity / Python)

`kzg_digest_to_field(digest) = Σ digest[i] · 256^i` for `i in 0..32`, modulo BN254 scalar field.

`publicInputs[2] = kzg_digest_to_field(modelCommitment) + hash_weights(witness)`.
