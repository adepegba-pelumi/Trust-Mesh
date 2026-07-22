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
      className={`rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 ${
        compact ? "not-prose my-8" : ""
      }`}
    >
      {!compact && <p className="mb-4 text-sm font-medium text-zinc-500">Architecture</p>}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        {steps.map((step, index) => (
          <span className="flex items-center gap-2" key={step}>
            <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {step}
            </span>
            {index < steps.length - 1 && <span className="text-zinc-400">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
