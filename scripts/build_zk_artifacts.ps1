# Build Halo2 keys, Solidity verifier, and deterministic test fixtures (Windows).
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Core = Join-Path $Root "packages\prover-core"
$Contracts = Join-Path $Root "packages\contracts"
$Prover = Join-Path $Root "packages\prover"
$Witness = Join-Path $Core "fixtures\sample_witness.json"
$Keys = Join-Path $Core "keys"
$Generated = Join-Path $Contracts "src\generated"
$ContractFixtures = Join-Path $Contracts "test\fixtures"
$ProverFixtures = Join-Path $Prover "tests\fixtures"

$env:TRUSTMESH_PROOF_SEED = "42"

Write-Host "==> Building trustmesh-prover-core (release)"
Push-Location $Core
cargo build --release
Pop-Location

$Prove = Join-Path $Core "target\release\trustmesh-prove.exe"
if (-not (Test-Path $Prove)) {
    throw "trustmesh-prove binary not found at $Prove"
}

Write-Host "==> Generating proving / verifying keys"
New-Item -ItemType Directory -Force -Path $Keys | Out-Null
& $Prove setup --output $Keys --json

Write-Host "==> Exporting Solidity Halo2 verifier"
New-Item -ItemType Directory -Force -Path $Generated | Out-Null
& $Prove export-solidity --keys $Keys --output $Generated --json

Write-Host "==> Generating proof fixtures"
New-Item -ItemType Directory -Force -Path $ContractFixtures, $ProverFixtures | Out-Null
& $Prove export-fixtures --witness $Witness --keys $Keys --output-dir $ContractFixtures --json
Copy-Item (Join-Path $ContractFixtures "proof_bundle.json") (Join-Path $ProverFixtures "proof_bundle.json") -Force
Copy-Item (Join-Path $ContractFixtures "witness.json") (Join-Path $ProverFixtures "witness.json") -Force

Write-Host "==> ZK artifacts ready"
Write-Host "    keys:      $Keys"
Write-Host "    verifier:  $Generated\Halo2Verifier.sol"
Write-Host "    fixtures:  $ContractFixtures\proof_bundle.json"
