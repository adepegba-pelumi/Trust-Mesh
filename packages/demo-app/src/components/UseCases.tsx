"use client";

import { ArrowUpRight } from "lucide-react";

import { BlockchainMeshIllustration } from "@/components/illustrations/BlockchainMeshIllustration";
import { FeatureCard } from "@/components/ui/feature-card";
import { MotionReveal } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";

const cases = [
  {
    tag: "Treasury agents",
    title: "Autonomous rebalancing you can prove",
    body: "Let an agent manage treasury allocations with every rebalance backed by a verifiable proof of the model that decided it.",
  },
  {
    tag: "DeFi execution",
    title: "Strategy signals, cryptographically attested",
    body: "Trading strategies stay private, but every signal is provably the output of the committed model — nothing swapped in silently.",
  },
  {
    tag: "Risk & compliance",
    title: "An audit trail regulators can check themselves",
    body: "VerifiedDecision events give compliance teams an immutable, independently checkable record of every automated action.",
  },
  {
    tag: "Agent marketplaces",
    title: "Let users verify before they delegate",
    body: "Publish a model's commitment once, and let anyone confirm an agent is still running exactly what it claims to.",
  },
];

export function UseCases() {
  return (
    <Section className="relative" id="use-cases">
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 hidden w-80 opacity-15 lg:block">
        <BlockchainMeshIllustration className="h-auto w-full" />
      </div>

      <SectionHeader label="use cases" title="Built for agents that hold real capital." />

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {cases.map((c, i) => (
          <MotionReveal delay={(i % 2) * 0.1} key={c.title}>
            <FeatureCard
              body={c.body}
              footer={
                <ArrowUpRight
                  aria-hidden
                  className="mt-6 h-4 w-4 text-zinc-600 transition-colors group-hover:text-emerald-400"
                />
              }
              tag={c.tag}
              title={c.title}
            />
          </MotionReveal>
        ))}
      </div>
    </Section>
  );
}
