"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import {
  PageShell,
  pageSubtitle,
  pageTitle,
  sectionLabel,
  surfaceCard,
} from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "Security model",
    items: [
      {
        label: "Model binding",
        text: "Agents register a KZG digest of quantized weights. Proofs bind private weights to that commitment inside the Halo2 circuit.",
      },
      {
        label: "Proof binding",
        text: "Public inputs include pool liquidity and post-trade concentration in basis points — the same values enforced by SafetyInterceptor.",
      },
      {
        label: "Execution gating",
        text: "Only allowlisted targets may be called; reentrancy guards protect verifyAndExecute.",
      },
    ],
  },
  {
    title: "What KZG provides",
    paragraphs: [
      "Kate commitments bind a quantized weight polynomial to elliptic-curve points using the Ethereum ceremony SRS. Partial openings reveal specific coefficients without exposing the full model.",
    ],
  },
  {
    title: "What Halo2 PLONK provides",
    paragraphs: [
      "The production pipeline replaces mock hash proofs with a real arithmetic circuit over BN254. The circuit verifies MLP inference, concentration derivation, and commitment binding before exporting an EVM-compatible proof.",
    ],
  },
  {
    title: "LangChain integration",
    paragraphs: [
      "The trustmesh_verify_defi_action tool wraps witness generation, proof creation, and verifyAndExecute submission. Agents receive structured JSON with success, transaction hash, and audit event fields.",
    ],
  },
  {
    title: "Repository structure",
    items: [
      { label: "packages/prover", text: "Python KZG + orchestration" },
      { label: "packages/prover-core", text: "Rust Halo2 circuit" },
      { label: "packages/contracts", text: "TrustMeshVerifier + generated verifier" },
      { label: "packages/langchain-tool", text: "LangChain BaseTool" },
      { label: "packages/demo-app", text: "Dashboard, agents UI, landing" },
    ],
  },
  {
    title: "Roadmap",
    items: [
      { label: "Stage 6.9", text: "External validation & release candidate (fresh-clone E2E audit)" },
      { label: "Stage 7", text: "Documentation packaging and preprint evidence bundle" },
      { label: "Future", text: "Full in-circuit KZG verification, larger model circuits, proof aggregation" },
    ],
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <AppNav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className={sectionLabel}>about</p>
        <h1 className={pageTitle}>About TrustMesh</h1>
        <p className={pageSubtitle}>
          TrustMesh lets autonomous DeFi agents prove that an inference step satisfied declared
          safety constraints before a transaction executes on-chain. The design separates model
          commitment (Stage 1), zero-knowledge proving (Stage 2), and policy enforcement (Stage 3).
        </p>

        <div className="mt-12 space-y-8">
          {sections.map((section) => (
            <section className={surfaceCard + " p-8"} key={section.title}>
              <h2 className="text-lg font-semibold text-zinc-100">{section.title}</h2>
              {"paragraphs" in section && section.paragraphs ? (
                <div className="mt-4 space-y-3">
                  {section.paragraphs.map((p) => (
                    <p className="text-sm leading-relaxed text-zinc-400" key={p}>
                      {p}
                    </p>
                  ))}
                </div>
              ) : null}
              {"items" in section && section.items ? (
                <ul className="mt-4 space-y-4">
                  {section.items.map((item) => (
                    <li className="flex flex-col gap-1 sm:flex-row sm:gap-3" key={item.label}>
                      <span className="shrink-0 font-mono text-xs text-emerald-400">{item.label}</span>
                      <span className="text-sm leading-relaxed text-zinc-400">{item.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <div className="rounded-2xl border border-emerald-500/15 bg-zinc-900/60 p-2 backdrop-blur">
            <ArchitectureDiagram compact />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="bg-emerald-500 text-emerald-950 shadow-[0_0_24px_-6px_rgba(52,211,153,0.6)] hover:bg-emerald-400">
              <Link href="/dashboard">
                Open demo dashboard
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="border-zinc-700 bg-transparent text-zinc-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300"
              variant="outline"
            >
              <Link href="/agents">Manage agents</Link>
            </Button>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
