# Release checklist — v1.0.0-rc

Use this checklist before tagging `v1.0.0-rc`.

## Pre-release validation

### Build reproducibility (Linux)

- [ ] Fresh clone: `bash scripts/bootstrap.sh` completes without error
- [ ] `bash scripts/build_zk_artifacts.sh` produces:
  - [ ] `packages/prover-core/keys/{params,pk,vk}.bin`
  - [ ] `packages/contracts/src/generated/Halo2Verifier.sol`
  - [ ] `packages/contracts/test/fixtures/proof_bundle.json`
  - [ ] `packages/prover/tests/fixtures/proof_bundle.json`
- [ ] **Verified by CI** on Ubuntu (not verified locally on Windows without WSL)

### Tests

- [ ] `TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/prover pytest`
- [ ] `TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/langchain-tool pytest`
- [ ] `cd packages/contracts && forge test -vv`
- [ ] `cd packages/prover-core && cargo test`
- [ ] `cd packages/demo-app && npm run lint && npm run test && npm run build`

### Security

- [ ] `TRUSTMESH_ALLOW_FIXTURES` unset in all production env examples
- [ ] `DEMO_API_ENABLED=false` in demo-app `.env.example`
- [ ] No secrets in git (`git grep -i "private.key\|0x[a-f0-9]\{64\}" -- ':!*.example' ':!test*'`)
- [ ] Review `SECURITY.md` trust assumptions with stakeholders

### Deployment (Sepolia)

- [ ] Run `bash scripts/build_zk_artifacts.sh`
- [ ] Configure `packages/contracts/.env` from `.env.example`
- [ ] `forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify`
- [ ] Record addresses in `docs/deployments.md` (do not fabricate)
- [ ] Update all `.env.example` files and `demo-app/src/config/contracts.ts` defaults
- [ ] Register test agent via `registerAgent(commitment, commitmentField)`
- [ ] Post-deploy: `forge test` against fork (optional) or manual `verifyAndExecute` smoke test

### Documentation

- [ ] `CHANGELOG.md` updated with release date
- [ ] `README.md` status section current
- [ ] ADR `proving-stack.md` status = Accepted
- [ ] `docs/performance.md` references CI benchmark artifact (no invented numbers)
- [ ] `docs/gas-report.md` reflects latest `forge test --gas-report`

### Demo app (Vercel)

- [ ] Set `NEXT_PUBLIC_*` env vars to deployed addresses
- [ ] `DEMO_API_ENABLED=false` on production URL
- [ ] Wallet connect tested in desktop browser with MetaMask

## Tag and publish

```bash
git tag -a v1.0.0-rc -m "TrustMesh v1.0.0-rc — Halo2 production pipeline"
git push origin v1.0.0-rc
```

- [ ] Create GitHub release from tag with `CHANGELOG.md` excerpt
- [ ] Upload CI `zk-artifacts` and `prover-core-benchmark` as release assets (optional)

## Rollback procedure

1. Pause agent traffic (stop LangChain workers / demo API).
2. If contract bug: deploy fixed `TrustMeshVerifier` + new verifier; update env addresses.
3. If prover bug: pin previous `trustmesh-prove` binary and proving keys; re-register agents if VK changed.
4. Document incident in `CHANGELOG.md` under `[Unreleased]`.

## Post-release validation

- [ ] Clone fresh repo; run bootstrap; all tests pass
- [ ] Demo dashboard loads with deployed contract addresses
- [ ] One successful `verifyAndExecute` on Sepolia with real proof

## Support matrix

| Platform | Build artifacts | Run tests | Deploy contracts | Demo app |
|----------|----------------|-----------|------------------|----------|
| Linux (Ubuntu 22.04+) | Yes | Yes | Yes | Yes |
| macOS | Yes | Yes | Yes | Yes |
| Windows (native) | Partial (MSVC required) | Partial | Yes | Yes |
| Windows (WSL) | Yes | Yes | Yes | Yes |
| Vercel | N/A | N/A | N/A | Yes (UI only; disable demo API) |
