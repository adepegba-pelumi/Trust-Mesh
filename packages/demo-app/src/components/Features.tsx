"use client";

import { Eye, GaugeCircle, Lock, Radar, Repeat, Workflow } from "lucide-react";

import { DashboardMockIllustration } from "@/components/illustrations/DashboardMockIllustration";
import { FeatureCard } from "@/components/ui/feature-card";
import { MotionReveal } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Lock,
    title: "Model privacy preserved",
    body: "Weights never leave your infrastructure. Only a KZG commitment and a proof are published.",
    span: "md:col-span-2",
  },
  {
    icon: Eye,
    title: "Verifiable, not trust-me",
    body: "Every inference ships with a Halo2 proof anyone can check against the on-chain commitment.",
    span: "",
  },
  {
    icon: GaugeCircle,
    title: "Real-time enforcement",
    body: "Liquidity, concentration, and velocity limits are checked before a single call executes.",
    span: "",
  },
  {
    icon: Workflow,
    title: "Drop-in agent registry",
    body: "Register once, prove continuously. TrustMesh slots into existing LangChain and agent pipelines.",
    span: "md:col-span-2",
  },
  {
    icon: Repeat,
    title: "Composable by design",
    body: "SafetyInterceptor rules are configurable per agent, per protocol, per position size.",
    span: "",
  },
  {
    icon: Radar,
    title: "Full audit trail",
    body: "VerifiedDecision events stream to your dashboard the moment they land on-chain.",
    span: "",
  },
];

export function Features() {
  return (
    <Section id="features" className="relative">
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/2 hidden w-72 -translate-y-1/2 opacity-20 lg:block">
        <DashboardMockIllustration className="h-auto w-full" />
      </div>

      <SectionHeader
        label="why teams choose trustmesh"
        title="Cryptographic guarantees, not promises."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {features.map((f, i) => (
          <MotionReveal className={cn(f.span)} delay={(i % 3) * 0.08} key={f.title}>
            <FeatureCard body={f.body} icon={f.icon} title={f.title} />
          </MotionReveal>
        ))}
      </div>
    </Section>
  );
}
