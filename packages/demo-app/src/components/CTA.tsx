"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MotionReveal } from "@/components/ui/motion";
import { surfaceCard } from "@/lib/design-tokens";

export function CTA() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <MotionReveal>
          <div
            className={`relative overflow-hidden px-6 py-14 text-center sm:px-16 sm:py-16 ${surfaceCard}`}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-1/2 h-[360px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[100px]" />
            </div>

            <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Ship AI agents people can actually verify.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-balance text-zinc-400">
              Register your first model commitment and get a working verifier on Sepolia in an
              afternoon.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Get started
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">
                  <FileText className="mr-1.5 h-4 w-4" />
                  Learn more
                </Link>
              </Button>
            </div>
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
