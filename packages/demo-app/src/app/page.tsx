import { AppNav } from "@/components/AppNav";
import { CTA } from "@/components/CTA";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
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
        <HowItWorks />
        <WhyTrustMesh />
        <SecurityCryptography />
        <UseCases />
        <CTA />
      </main>
      <Footer />
    </PageShell>
  );
}