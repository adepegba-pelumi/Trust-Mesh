import { AgentManagement } from "@/components/AgentManagement";
import { AppNav } from "@/components/AppNav";
import { PageShell, linkAccent } from "@/components/PageShell";
import { MotionReveal } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { pageMain } from "@/lib/design-tokens";
import { trustMeshVerifierAddress } from "@/config/contracts";
import { sepoliaExplorerAddress } from "@/config/network";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  return (
    <PageShell>
      <AppNav />
      <main className={cn(pageMain)}>
        <PageHeader
          actions={
            <a
              className={linkAccent}
              href={sepoliaExplorerAddress(trustMeshVerifierAddress)}
              rel="noreferrer"
              target="_blank"
            >
              Verifier {trustMeshVerifierAddress.slice(0, 10)}…
            </a>
          }
          description="Register agents on Sepolia without running Python scripts."
          label="agents"
          title="Agent management"
        />
        <MotionReveal>
          <AgentManagement />
        </MotionReveal>
      </main>
    </PageShell>
  );
}
