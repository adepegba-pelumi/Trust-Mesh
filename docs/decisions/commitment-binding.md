# Commitment binding (Stage 6.75B)

## Cryptographic linkage

1. **Stage 1 (off-chain KZG)** — Agent registers `modelCommitment = kzg_commit(quantize(weights))`.
2. **Witness (private)** — Prover supplies quantized weights, features, and `model_commitment` bytes32.
3. **Python validation** — `validate_witness_against_commitment()` rejects witnesses whose digest ≠ registered commitment.
4. **Circuit public input [2]** — `Fr = kzg_digest_to_field(model_commitment) + hash_weights(witness)`.
5. **Halo2 proof** — Binds all three public inputs, including [2].
6. **Solidity** — `Halo2PlonkVerifier.verifyProof()` checks the SNARK; `CommitmentBinding.verifyRegisteredDigest()` ensures [2] incorporates the registered digest field map.

## Failure modes

| Tamper | Result |
|--------|--------|
| Different weights | Different `hash_weights` → different public [2] → proof invalid |
| Different commitment in witness | Python rejection before proving |
| Different public [2] on-chain | Halo2 verify fails or commitment binding reverts |
| Different liquidity/concentration | Public [0]/[1] mismatch → proof invalid |

## Field map (Rust / Solidity)

`kzg_digest_to_field(digest) = Σ digest[i] · 256^i` for `i in 0..32`.
