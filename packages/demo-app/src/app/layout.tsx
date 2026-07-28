import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/Providers";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TrustMesh — Verifiable AI Agents",
  description: "Live Sepolia visualization of the TrustMesh agent verification pipeline",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased", inter.className)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
