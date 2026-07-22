import { AgentManagement } from "@/components/AgentManagement";
import { AppNav } from "@/components/AppNav";
import {
  PageShell,
  linkAccent,
  pageSubtitle,
  pageTitle,
  sectionLabel,
} from "@/components/PageShell";
import { trustMeshVerifierAddress } from "@/config/contracts";
import { sepoliaExplorerAddress } from "@/config/network";

export default function AgentsPage() {
  return (
    <PageShell>
      <AppNav />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={sectionLabel}>agents</p>
            <h1 className={pageTitle}>Agent management</h1>
            <p className={pageSubtitle}>
              Register agents on Sepolia without running Python scripts.
            </p>
          </div>
          <a
            className={linkAccent}
            href={sepoliaExplorerAddress(trustMeshVerifierAddress)}
            rel="noreferrer"
            target="_blank"
          >
            Verifier {trustMeshVerifierAddress.slice(0, 10)}…
          </a>
        </div>
        <AgentManagement />
      </main>
    </PageShell>
  );
}
