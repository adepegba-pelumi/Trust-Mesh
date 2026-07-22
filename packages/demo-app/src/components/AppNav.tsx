"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/about", label: "About" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-semibold">TrustMesh</p>
            <p className="text-xs text-muted-foreground">Sepolia developer tools</p>
          </div>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Button
                asChild
                className={cn(
                  pathname === link.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground",
                )}
                key={link.href}
                size="sm"
                variant="ghost"
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
}
