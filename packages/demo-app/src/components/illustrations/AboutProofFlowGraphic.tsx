"use client";

type AboutProofFlowGraphicProps = {
  className?: string;
};

/** model → commitment → proof — pipeline-style node diagram for the About hero. */
export function AboutProofFlowGraphic({ className }: AboutProofFlowGraphicProps) {
  return (
    <div
      aria-hidden
      className={
        className ??
        "flex h-[200px] items-center justify-center rounded-xl border border-[#EAEAEC] bg-white sm:h-[220px]"
      }
    >
      <svg
        className="h-full w-full max-w-lg px-6"
        fill="none"
        viewBox="0 0 420 160"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Edges */}
        <line stroke="#D1D1D6" strokeWidth="1.25" x1="78" x2="168" y1="72" y2="72" />
        <line stroke="#D1D1D6" strokeWidth="1.25" x1="218" x2="308" y1="72" y2="72" />

        {/* Arrow heads */}
        <path d="M162 68 L172 72 L162 76" fill="none" stroke="#D1D1D6" strokeWidth="1.25" />
        <path d="M302 68 L312 72 L302 76" fill="none" stroke="#D1D1D6" strokeWidth="1.25" />

        {/* Node 1 — Model (outline) */}
        <circle cx="52" cy="72" fill="#FFFFFF" r="18" stroke="#111111" strokeWidth="1.5" />
        <circle cx="52" cy="72" fill="#111111" r="4" />

        {/* Node 2 — Commitment (accent) */}
        <circle cx="193" cy="72" fill="#22C55E" r="18" stroke="#22C55E" strokeWidth="1.5" />
        <circle cx="193" cy="72" fill="#FFFFFF" r="4" />

        {/* Node 3 — Proof (accent outline + fill ring) */}
        <circle cx="334" cy="72" fill="#FFFFFF" r="18" stroke="#22C55E" strokeWidth="1.5" />
        <circle cx="334" cy="72" fill="#22C55E" r="5" />

        {/* Labels */}
        <text
          fill="#111111"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          x="52"
          y="112"
        >
          Model
        </text>
        <text
          fill="#6E6E76"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          textAnchor="middle"
          x="52"
          y="128"
        >
          weights
        </text>

        <text
          fill="#111111"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          x="193"
          y="112"
        >
          Commitment
        </text>
        <text
          fill="#6E6E76"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          textAnchor="middle"
          x="193"
          y="128"
        >
          KZG
        </text>

        <text
          fill="#111111"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          x="334"
          y="112"
        >
          Proof
        </text>
        <text
          fill="#6E6E76"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          textAnchor="middle"
          x="334"
          y="128"
        >
          Halo2
        </text>
      </svg>
    </div>
  );
}
