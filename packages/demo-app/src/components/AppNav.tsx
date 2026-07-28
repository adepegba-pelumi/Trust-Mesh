"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, ShieldCheck, X } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur transition-colors duration-200 supports-[backdrop-filter]:bg-zinc-950/60",
        scrolled
          ? "border-zinc-800/80 bg-zinc-950/80"
          : "border-transparent bg-zinc-950/40",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-8">
          <Link className="group flex shrink-0 items-center gap-2.5" href="/">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 transition-colors group-hover:border-emerald-500/40">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span>
              <p className="text-sm font-semibold leading-none text-zinc-100 transition-colors group-hover:text-emerald-300">
                TrustMesh
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase leading-none tracking-widest text-zinc-500">
                Sepolia · developer tools
              </p>
            </span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Button
                  asChild
                  className={cn(
                    "relative",
                    active
                      ? "text-emerald-400 hover:bg-zinc-900 hover:text-emerald-300"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  )}
                  key={link.href}
                  size="sm"
                  variant="ghost"
                >
                  <Link href={link.href}>
                    {link.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-[13px] h-px bg-emerald-400" />
                    )}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <WalletConnect />
          </div>

          <Button asChild className="hidden sm:inline-flex" size="sm">
            <Link href="/dashboard">
              Get started
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>

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
          "grid overflow-hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur transition-[grid-template-rows] duration-200 ease-out md:hidden",
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

            <Button asChild className="mt-2 sm:hidden" size="sm">
              <Link href="/dashboard">
                Get started
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>

            <div className="mt-2 border-t border-zinc-800 pt-2 sm:hidden">
              <WalletConnect />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}