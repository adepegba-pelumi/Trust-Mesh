import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Features", href: "/#features" },
      { label: "Security", href: "/#security" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "About", href: "/about" },
      { label: "Agents", href: "/agents" },
      { label: "GitHub", href: "https://github.com/adepegba-pelumi/Trust-Mesh" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Use cases", href: "/#use-cases" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-900">
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 text-zinc-100">
              <ShieldCheck aria-hidden className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold">TrustMesh</span>
            </div>
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-zinc-500">
              Verifiable AI infrastructure for agents that hold real capital.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="text-sm text-zinc-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-zinc-900 pt-8 sm:flex-row">
          <p className="font-mono text-xs text-zinc-600">
            © {new Date().getFullYear()} TrustMesh. Built on Sepolia.
          </p>
          <p className="font-mono text-xs text-zinc-600">KZG · Halo2 · Solidity</p>
        </div>
      </Container>
    </footer>
  );
}
