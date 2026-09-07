"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, GaugeCircle, Lock } from "lucide-react";

import { IconBox } from "@/components/ui/feature-card";
import { MotionReveal } from "@/components/ui/motion";
import { Section } from "@/components/ui/section";
import { sectionLabelMuted, sectionTitle } from "@/lib/design-tokens";

const points = [
  {
    icon: Eye,
    title: "Cryptographic proof, not promises",
    body: "Every inference ships with a Halo2 proof anyone can check against the on-chain commitment.",
  },
  {
    icon: Lock,
    title: "Model privacy preserved",
    body: "Weights never leave your infrastructure. Only a KZG commitment and a proof are published.",
  },
  {
    icon: GaugeCircle,
    title: "Real-time on-chain enforcement",
    body: "Liquidity, concentration, and velocity limits are checked before a single call executes.",
  },
];

export function About() {
  return (
    <Section className="bg-[#FAFAFA]" id="about">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-20">
        <MotionReveal className="order-1">
          <div className="relative h-[200px] overflow-hidden rounded-xl border border-[#EAEAEC] bg-white lg:h-auto lg:min-h-[320px]">
            <Image
              alt="TrustMesh verified agent network"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 40vw, 92vw"
              src="/images/hero-network.png"
            />
          </div>
        </MotionReveal>

        <MotionReveal className="order-2" delay={0.08}>
          <div className="max-w-xl">
            <p className={sectionLabelMuted}>about trustmesh</p>

            <h2 className={`mt-4 font-display ${sectionTitle}`}>
              Built because &ldquo;trust me&rdquo; isn&apos;t a security model.
            </h2>

            <div className="mt-6 space-y-4 text-[15px] leading-7 text-brand-muted sm:text-base">
              <p>
                TrustMesh is verifiable AI infrastructure for agents that hold real capital. It
                exists for the gap between &ldquo;trust me&rdquo; claims and what you can actually
                prove on-chain.
              </p>
              <p>
                It binds model commitments to zero-knowledge proofs — KZG plus Halo2 — so every
                inference can be verified on-chain without exposing the model or the data behind
                it.
              </p>
              <p>
                The difference is cryptographic guarantees instead of promises. Model weights never
                leave your infrastructure; only a commitment and a proof are published.
              </p>
            </div>

            <ul className="mt-10 space-y-5">
              {points.map((point) => (
                <li className="flex gap-3.5" key={point.title}>
                  <IconBox className="h-9 w-9 shrink-0 rounded-lg [&_svg]:h-4 [&_svg]:w-4" icon={point.icon} />
                  <div>
                    <p className="text-sm font-semibold text-brand-charcoal">{point.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-brand-muted">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              className="mt-10 inline-flex items-center gap-1.5 text-sm text-brand-muted transition-colors hover:text-brand-accent"
              href="#security"
            >
              View the security model
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </MotionReveal>
      </div>
    </Section>
  );
}
