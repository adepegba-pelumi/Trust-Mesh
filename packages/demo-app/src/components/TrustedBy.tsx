"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/container";
import { useMotionVariants } from "@/lib/motion";

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
    <section className="border-y border-zinc-900 bg-zinc-950/40">
      <Container className="py-10">
        <p className="text-center font-mono text-[11px] uppercase tracking-widest text-zinc-600">
          built on the infrastructure you already trust
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {partners.map((name, i) => (
            <motion.span
              key={name}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-300"
              initial="hidden"
              transition={{ ...transition, delay: i * 0.06 }}
              variants={fadeIn}
              viewport={{ once: true }}
              whileInView="show"
            >
              {name}
            </motion.span>
          ))}
        </div>
      </Container>
    </section>
  );
}
