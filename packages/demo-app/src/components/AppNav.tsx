"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link className="shrink-0 group" href="/">
            <p className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
              TrustMesh
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Sepolia · developer tools
            </p>
          </Link>

          <nav className="hidden md:flex gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Button
                  asChild
                  className={cn(
                    active
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  )}
                  key={link.href}
                  size="sm"
                  variant="ghost"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <WalletConnect />
          </div>

          <Button
            aria-controls="mobile-nav"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            size="icon"
            variant="ghost"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden grid overflow-hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-0",
        )}
        id="mobile-nav"
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Button
                  asChild
                  className={cn(
                    "justify-start",
                    active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  )}
                  key={link.href}
                  size="sm"
                  variant="ghost"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              );
            })}
            <div className="mt-2 border-t border-zinc-800 pt-2 sm:hidden">
              <WalletConnect />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
