# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.0-rc | Yes |
| < 1.0.0-rc | No |

## Reporting a vulnerability

Email security concerns privately to the repository maintainers (contact TBD before public release). Do **not** open public GitHub issues for undisclosed vulnerabilities.

Include:

- Affected package and file paths
- Reproduction steps or proof-of-concept
- Impact assessment (confidentiality, integrity, availability)
- Suggested fix if available

## Trust assumptions (Stage 6.8)

TrustMesh v1.0.0-rc is a **research / demo release**. Production deployments must understand:

| Layer | Trust assumption |
|-------|------------------|
| **Halo2 circuit** | Proves inference + public market inputs + commitment field binding for the demo MLP circuit (4×8×4). Does **not** bind transaction `value` or `calldata`. |
| **KZG commitment** | Stage 1 digest registered on-chain; Python recomputes KZG from witness before proving. Full KZG opening verification is off-chain. |
| **On-chain verifier** | `TrustMeshVerifier.verifyAndExecute` verifies proof + safety constraints and emits `VerifiedDecision`. It does **not** execute the transaction payload. |
| **Agent binding** | Any caller may invoke `verifyAndExecute` for a registered agent address (no `msg.sender` check). |
| **Fixture mode** | `TRUSTMESH_ALLOW_FIXTURES=true` disables real proving and loads CI fixtures. **Never set in production.** |
| **Demo app API** | `/api/demo/run` and `/api/agents/commitment` spawn Python e2e scripts. Disabled by default (`DEMO_API_ENABLED` must be `true`). Never expose without authentication on public hosts. |

## Secure deployment checklist

1. Run `bash scripts/build_zk_artifacts.sh` on Linux; deploy generated `Halo2Verifier.sol` via `Deploy.s.sol`.
2. Set `TRUSTMESH_PROVE_BIN`, `TRUSTMESH_PROVING_KEYS`, `TRUSTMESH_WITNESS_PATH` for agents — never commit `.env` files.
3. Do **not** set `TRUSTMESH_ALLOW_FIXTURES` in production.
4. Keep `DEMO_API_ENABLED=false` on Vercel/public deployments.
5. If demo APIs are required locally, set `DEMO_API_SECRET` and pass `Authorization: Bearer <secret>`.
6. Use a private Sepolia RPC endpoint; rotate agent keys independently of deployer keys.
7. Re-run `forge test` and Python security tests after every circuit or verifier change.

## Known limitations (not vulnerabilities in demo scope)

- Transaction payload parameters are not ZK-bound (documented architectural limit).
- `verifyAndExecute` is verify-only (no on-chain execution).
- Windows hosts cannot reliably build `trustmesh-prove` without MSVC/WSL.

See `docs/RELEASE_CHECKLIST.md` and `CHANGELOG.md` for release-specific notes.
