"use client";

import { useCallback, useEffect, useState } from "react";

import type { TrustMeshUserTransaction } from "@/lib/transactions";

export function useMyTransactions(enabled = true) {
  const [transactions, setTransactions] = useState<TrustMeshUserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/transactions", { credentials: "same-origin" });
      if (response.status === 401) {
        setError("Sign in to view your transactions.");
        setTransactions([]);
        return;
      }
      if (!response.ok) {
        setError("Unable to load your transactions.");
        setTransactions([]);
        return;
      }
      const payload = (await response.json()) as { transactions?: TrustMeshUserTransaction[] };
      setTransactions(payload.transactions ?? []);
    } catch {
      setError("Unable to load your transactions.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { transactions, isLoading, error, refresh };
}
