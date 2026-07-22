"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { WalletConnect } from "@/components/WalletConnect";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">TrustMesh</p>
            <p className="text-xs text-zinc-500">Sepolia developer tools</p>
          </div>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname === link.href
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
}
