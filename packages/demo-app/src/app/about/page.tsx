"use client";

import Link from "next/link";

import { AppNav } from "@/components/AppNav";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-3xl px-6 py-12 prose prose-zinc dark:prose-invert">
        <h1>About TrustMesh</h1>
        <p>
          TrustMesh lets autonomous DeFi agents prove that an inference step satisfied declared
          safety constraints before a transaction executes on-chain. The design separates model
          commitment (Stage 1), zero-knowledge proving (Stage 2), and policy enforcement (Stage 3).
        </p>

        <h2>Security model</h2>
        <ul>
          <li>
            <strong>Model binding:</strong> Agents register a KZG digest of quantized weights.
            Proofs bind private weights to that commitment inside the Halo2 circuit.
          </li>
          <li>
            <strong>Proof binding:</strong> Public inputs include pool liquidity and post-trade
            concentration in basis points — the same values enforced by SafetyInterceptor.
          </li>
          <li>
            <strong>Execution gating:</strong> Only allowlisted targets may be called; reentrancy
            guards protect verifyAndExecute.
          </li>
        </ul>

        <h2>What KZG provides</h2>
        <p>
          Kate commitments bind a quantized weight polynomial to elliptic-curve points using the
          Ethereum ceremony SRS. Partial openings reveal specific coefficients without exposing the
          full model.
        </p>

        <h2>What Halo2 PLONK provides</h2>
        <p>
          The production pipeline replaces mock hash proofs with a real arithmetic circuit over
          BN254. The circuit verifies MLP inference, concentration derivation, and commitment binding
          before exporting an EVM-compatible proof.
        </p>

        <h2>LangChain integration</h2>
        <p>
          The <code>trustmesh_verify_defi_action</code> tool wraps witness generation, proof creation,
          and verifyAndExecute submission. Agents receive structured JSON with success, transaction
          hash, and audit event fields.
        </p>

        <h2>Repository structure</h2>
        <ul>
          <li><code>packages/prover</code> — Python KZG + orchestration</li>
          <li><code>packages/prover-core</code> — Rust Halo2 circuit</li>
          <li><code>packages/contracts</code> — TrustMeshVerifier + generated verifier</li>
          <li><code>packages/langchain-tool</code> — LangChain BaseTool</li>
          <li><code>packages/demo-app</code> — Dashboard, agents UI, landing</li>
        </ul>

        <ArchitectureDiagram compact />

        <h2>Roadmap</h2>
        <ul>
          <li>Stage 6.9 — External validation &amp; release candidate (fresh-clone E2E audit)</li>
          <li>Stage 7 — Documentation packaging and preprint evidence bundle</li>
          <li>Future — Full in-circuit KZG verification, larger model circuits, proof aggregation</li>
        </ul>

        <p>
          <Link href="/dashboard">Open the demo dashboard</Link> or{" "}
          <Link href="/agents">manage agents</Link>.
        </p>
      </main>
    </div>
  );
}
