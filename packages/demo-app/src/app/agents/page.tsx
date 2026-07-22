import { AgentManagement } from "@/components/AgentManagement";
import { AppNav } from "@/components/AppNav";
import { trustMeshVerifierAddress } from "@/config/contracts";
import { sepoliaExplorerAddress } from "@/config/web3";

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <AppNav />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Agent management
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Register agents on Sepolia without running Python scripts.
            </p>
          </div>
          <a
            className="font-mono text-xs text-sky-600 hover:underline dark:text-sky-400"
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
