"use client";

import { Check } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { Section, SectionHeader } from "@/components/ui/section";
import { surfaceCard } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const stats = [
  { value: "0", label: "model weights ever exposed" },
  { value: "100%", label: "of decisions proof-backed" },
  { value: "<12s", label: "median proof generation" },
  { value: "1", label: "verifier contract, fully public" },
];

const rows = [
  { capability: "Model IP stays private", others: "Rarely", trustmesh: "Always" },
  {
    capability: "Every decision independently verifiable",
    others: "Sometimes",
    trustmesh: "Always",
  },
  {
    capability: "On-chain safety enforcement",
    others: "Off-chain, trust-based",
    trustmesh: "On-chain, cryptographic",
  },
  {
    capability: "Audit trail",
    others: "Logs you have to trust",
    trustmesh: "Immutable events",
  },
];

export function WhyTrustMesh() {
  return (
    <Section id="why" className="bg-[#F7F7F7]">
      <SectionHeader label="why it matters" title={`"Trust me" isn't a security model.`} />

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard index={i} key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className={cn("mt-6 overflow-hidden", surfaceCard)}>
        <div className="grid grid-cols-3 bg-[#F7F7F7] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted sm:px-6">
          <span>Capability</span>
          <span>Typical AI agents</span>
          <span className="text-brand-accent">TrustMesh</span>
        </div>
        {rows.map((row, i) => (
          <div
            className={cn(
              "grid grid-cols-3 items-center border-t border-brand-border px-4 py-5 text-sm sm:px-6",
              i % 2 === 0 ? "bg-white" : "bg-[#F7F7F7]/70",
            )}
            key={row.capability}
          >
            <span className="pr-2 font-medium text-brand-charcoal">{row.capability}</span>
            <span className="text-brand-muted/80">{row.others}</span>
            <span className="inline-flex items-start gap-1.5 font-semibold text-brand-accent">
              <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {row.trustmesh}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
