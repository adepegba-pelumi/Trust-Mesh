"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { surfaceCard } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type DefItem = { label: string; text: string };

function DocCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(surfaceCard, "flex h-full flex-col p-6", className)}>
      <h2 className="text-lg font-bold tracking-tight text-[#111111]">{title}</h2>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

function DefinitionList({ items }: { items: DefItem[] }) {
  return (
    <dl className="space-y-3">
      {items.map((item) => (
        <div
          className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start sm:gap-4"
          key={item.label}
        >
          <dt className="font-mono text-xs font-medium text-[#22C55E]">{item.label}</dt>
          <dd className="text-sm leading-relaxed text-[#6E6E76]">{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-[#6E6E76]">{children}</p>;
}

const securityItems: DefItem[] = [
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
];

const repoItems: DefItem[] = [
  { label: "packages/prover", text: "Python KZG + orchestration" },
  { label: "packages/prover-core", text: "Rust Halo2 circuit" },
  { label: "packages/contracts", text: "TrustMeshVerifier + generated verifier" },
  { label: "packages/langchain-tool", text: "LangChain BaseTool" },
  { label: "packages/demo-app", text: "Dashboard, agents UI, landing" },
];

const roadmapItems: DefItem[] = [
  {
    label: "Stage 6.9",
    text: "External validation & release candidate (fresh-clone E2E audit)",
  },
  { label: "Stage 7", text: "Documentation packaging and preprint evidence bundle" },
  {
    label: "Future",
    text: "Full in-circuit KZG verification, larger model circuits, proof aggregation",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <AppNav />
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-12">
        {/* Hero — wide, left-aligned */}
        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          <PageHeader
            className="max-w-2xl [&_p]:max-w-xl"
            description="TrustMesh lets autonomous DeFi agents prove that an inference step satisfied declared safety constraints before a transaction executes on-chain. The design separates model commitment (Stage 1), zero-knowledge proving (Stage 2), and policy enforcement (Stage 3)."
            label="about"
            title="About TrustMesh"
          />
          <MotionReveal>
            <div className="relative h-[200px] overflow-hidden rounded-xl border border-[#EAEAEC] bg-white sm:h-[220px]">
              <Image
                alt="Model commitment to zero-knowledge proof flow"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 40vw, 92vw"
                src="/images/zk-verification.png"
              />
            </div>
          </MotionReveal>
        </div>

        {/* Explainer card grid — 3 rows × 2 columns */}
        <div className="flex flex-col gap-6">
          <MotionReveal>
            <div className="grid gap-6 lg:grid-cols-5">
              <DocCard className="lg:col-span-3" title="Security model">
                <DefinitionList items={securityItems} />
              </DocCard>
              <DocCard className="lg:col-span-2" title="What KZG provides">
                <Body>
                  Kate commitments bind a quantized weight polynomial to elliptic-curve points using
                  the Ethereum ceremony SRS. Partial openings reveal specific coefficients without
                  exposing the full model.
                </Body>
              </DocCard>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.04}>
            <div className="grid gap-6 lg:grid-cols-2">
              <DocCard title="What Halo2 PLONK provides">
                <Body>
                  The production pipeline replaces mock hash proofs with a real arithmetic circuit
                  over BN254. The circuit verifies MLP inference, concentration derivation, and
                  commitment binding before exporting an EVM-compatible proof.
                </Body>
              </DocCard>
              <DocCard title="LangChain integration">
                <Body>
                  The trustmesh_verify_defi_action tool wraps witness generation, proof creation, and
                  verifyAndExecute submission. Agents receive structured JSON with success,
                  transaction hash, and audit event fields.
                </Body>
              </DocCard>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.08}>
            <div className="grid gap-6 lg:grid-cols-2">
              <DocCard title="Repository structure">
                <DefinitionList items={repoItems} />
              </DocCard>
              <DocCard title="Roadmap">
                <DefinitionList items={roadmapItems} />
              </DocCard>
            </div>
          </MotionReveal>
        </div>

        {/* Pipeline strip */}
        <MotionReveal delay={0.1}>
          <ArchitectureDiagram compact />
        </MotionReveal>

        {/* Closing CTAs */}
        <MotionReveal className="flex flex-wrap gap-3" delay={0.12}>
          <Button asChild>
            <Link href="/dashboard">
              Open demo dashboard
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/agents">Manage agents</Link>
          </Button>
        </MotionReveal>
      </main>
    </PageShell>
  );
}
