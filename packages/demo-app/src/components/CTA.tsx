"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MotionReveal } from "@/components/ui/motion";

export function CTA() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <MotionReveal>
          <div className="relative overflow-hidden rounded-3xl border border-[#EDEBE4] bg-white px-6 py-14 text-center shadow-soft sm:px-16 sm:py-16">
            <h2 className="font-display text-balance text-3xl font-semibold tracking-tight text-[#2A2A28] sm:text-4xl">
              Ship AI agents people can actually verify.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-balance leading-relaxed text-[#6B6B66]">
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
