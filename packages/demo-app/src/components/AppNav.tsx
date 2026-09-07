"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";

import { AuthAccountMenu } from "@/components/AuthAccountMenu";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";
import { cn } from "@/lib/utils";

const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, loading } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAuthenticated = Boolean(user);

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
        "sticky top-0 z-50 border-b border-[#111111]/[0.05] bg-white/90 backdrop-blur transition-shadow duration-200",
        scrolled && "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-[25px] sm:px-6">
        <div className="flex items-center gap-8">
          <Link className="group flex shrink-0 items-center gap-2.5" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[#22C55E]">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <span>
              <p className="text-sm font-semibold leading-none text-[#111111]">TrustMesh</p>
              <p className="mt-1 text-[10px] font-medium uppercase leading-none tracking-widest text-[#6E6E76]">
                Sepolia · developer tools
              </p>
            </span>
          </Link>

          {isAuthenticated ? (
            <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Application">
              {appLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Button
                    asChild
                    className={cn(
                      "relative rounded-none px-3",
                      active
                        ? "text-[#111111] hover:bg-transparent hover:text-[#111111]"
                        : "text-[#6E6E76] hover:bg-transparent hover:text-[#111111]",
                    )}
                    key={link.href}
                    size="sm"
                    variant="ghost"
                  >
                    <Link href={link.href}>
                      {link.label}
                      {active && (
                        <span className="absolute inset-x-3 -bottom-[14px] h-0.5 bg-[#111111]" />
                      )}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div aria-hidden className="h-8 w-28 animate-pulse rounded-lg bg-[#F7F7F8]" />
          ) : isAuthenticated ? (
            <>
              <div className="hidden sm:block">
                <WalletConnect />
              </div>
              <div className="hidden sm:block">
                <AuthAccountMenu email={user?.email ?? "Account"} />
              </div>
              <Button
                aria-controls="mobile-nav"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                className="md:hidden"
                onClick={() => setOpen((v) => !v)}
                size="icon"
                variant="ghost"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated ? (
        <div
          className={cn(
            "grid overflow-hidden border-t border-[#EAEAEC] bg-white transition-[grid-template-rows] duration-200 ease-out md:hidden",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-0",
          )}
          id="mobile-nav"
        >
          <div className="min-h-0">
            <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Application">
              {appLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Button
                    asChild
                    className={cn(
                      "justify-start",
                      active ? "bg-[#F7F7F8] text-[#111111]" : "text-[#6E6E76]",
                    )}
                    key={link.href}
                    size="sm"
                    variant="ghost"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                );
              })}

              <div className="mt-2 border-t border-[#EAEAEC] pt-2">
                <AuthAccountMenu
                  className="mb-3 w-full flex-col items-stretch"
                  compact
                  email={user?.email ?? "Account"}
                />
                <WalletConnect />
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
