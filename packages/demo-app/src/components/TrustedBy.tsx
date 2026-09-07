"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/container";
import { useMotionVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const partners = [
  "Ethereum Foundation",
  "Sepolia",
  "LangChain",
  "Halo2",
  "py_ecc",
  "OpenZeppelin",
];

export function TrustedBy() {
  const { fadeIn, transition } = useMotionVariants();

  return (
    <section className="border-y border-[#EDEBE4] bg-[#F7F7F7]">
      <Container className="py-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-[#6B6B66]">
          built on the infrastructure you already trust
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {partners.map((name, i) => {
            const highlighted = name === "OpenZeppelin";
            return (
              <motion.span
                key={name}
                className={cn(
                  "text-sm font-medium transition-colors",
                  highlighted
                    ? "text-[#2A2A28]"
                    : "text-[#A8A89F] hover:text-[#6B6B66]",
                )}
                initial="hidden"
                transition={{ ...transition, delay: i * 0.06 }}
                variants={fadeIn}
                viewport={{ once: true }}
                whileInView="show"
              >
                {name}
              </motion.span>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
