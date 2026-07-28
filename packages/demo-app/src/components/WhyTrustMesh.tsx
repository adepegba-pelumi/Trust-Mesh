"use client";

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
  { capability: "Every decision independently verifiable", others: "Sometimes", trustmesh: "Always" },
  { capability: "On-chain safety enforcement", others: "Off-chain, trust-based", trustmesh: "On-chain, cryptographic" },
  { capability: "Audit trail", others: "Logs you have to trust", trustmesh: "Immutable events" },
];

export function WhyTrustMesh() {
  return (
    <Section id="why">
      <SectionHeader label="why it matters" title={`"Trust me" isn't a security model.`} />

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard index={i} key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className={cn("mt-6 overflow-hidden", surfaceCard)}>
        <div className="grid grid-cols-3 bg-zinc-900/60 px-4 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:px-6">
          <span>Capability</span>
          <span>Typical AI agents</span>
          <span className="text-emerald-400">TrustMesh</span>
        </div>
        {rows.map((row, i) => (
          <div
            className={cn(
              "grid grid-cols-3 items-center px-4 py-4 text-sm sm:px-6",
              i % 2 === 0 ? "bg-zinc-950/60" : "bg-zinc-950/30",
            )}
            key={row.capability}
          >
            <span className="text-zinc-200">{row.capability}</span>
            <span className="text-zinc-500">{row.others}</span>
            <span className="font-medium text-emerald-300">{row.trustmesh}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
