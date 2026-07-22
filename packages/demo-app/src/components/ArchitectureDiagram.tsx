"use client";

export function ArchitectureDiagram({ compact = false }: { compact?: boolean }) {
  const steps = [
    "Agent weights",
    "KZG commit",
    "Halo2 proof",
    "TrustMeshVerifier",
    "DeFi target",
    "Audit event",
  ];

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 ${compact ? "my-0" : ""}`}
    >
      {!compact && (
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500">Architecture</p>
      )}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        {steps.map((step, index) => (
          <span className="flex items-center gap-2" key={step}>
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-400">
              {step}
            </span>
            {index < steps.length - 1 && <span className="text-zinc-600">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
