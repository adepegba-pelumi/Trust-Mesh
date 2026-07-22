"use client";

import Link from "next/link";

import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <div>
      <div className="border-b border-zinc-200 bg-zinc-100 px-6 py-2 text-center text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Demo dashboard —{" "}
        <Link className="underline" href="/">
          back to home
        </Link>
      </div>
      <Dashboard />
    </div>
  );
}
