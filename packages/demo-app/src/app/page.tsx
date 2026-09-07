import { AppNav } from "@/components/AppNav";
import { About } from "@/components/About";
import { CTA } from "@/components/CTA";
import { Features } from "@/components/Features";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PageShell } from "@/components/PageShell";
import { SecurityCryptography } from "@/components/SecurityCryptography";
import { TrustedBy } from "@/components/TrustedBy";
import { UseCases } from "@/components/UseCases";
import { WhyTrustMesh } from "@/components/WhyTrustMesh";


export default function LandingPage() {
  return (
    <PageShell>
      <AppNav />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <About />
        <HowItWorks />
        <WhyTrustMesh />
        <SecurityCryptography />
        <UseCases />
        <CTA />
      </main>
    </PageShell>
  );
}