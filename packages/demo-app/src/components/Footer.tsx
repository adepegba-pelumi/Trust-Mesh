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
    <footer className="bg-[#111111]">
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-[#2FAE6E]">
                <ShieldCheck aria-hidden className="h-4 w-4" />
              </span>
              <span className="font-semibold">TrustMesh</span>
            </div>
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/55">
              Verifiable AI infrastructure for agents that hold real capital.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="text-sm text-white/75 transition-colors hover:text-[#2FAE6E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2FAE6E]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
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

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} TrustMesh. Built on Sepolia.
          </p>
          <p className="text-xs text-white/40">KZG · Halo2 · Solidity</p>
        </div>
      </Container>
    </footer>
  );
}
