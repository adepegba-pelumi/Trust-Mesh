import { AgentManagement } from "@/components/AgentManagement";
import { AppNav } from "@/components/AppNav";
import { trustMeshVerifierAddress } from "@/config/contracts";
import { sepoliaExplorerAddress } from "@/config/web3";

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agent management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Register agents on Sepolia without running Python scripts.
            </p>
          </div>
          <a
            className="font-mono text-xs text-primary hover:underline"
            href={sepoliaExplorerAddress(trustMeshVerifierAddress)}
            rel="noreferrer"
            target="_blank"
          >
            Verifier {trustMeshVerifierAddress.slice(0, 10)}…
          </a>
        </div>
        <AgentManagement />
      </main>
    </div>
  );
}
