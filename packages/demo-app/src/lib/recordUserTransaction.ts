import type { CreateTransactionBody } from "@/lib/transactions";

/** Associate a confirmed on-chain tx with the authenticated Supabase user (session cookies). */
export async function recordUserTransaction(input: CreateTransactionBody): Promise<boolean> {
  try {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tx_hash: input.tx_hash,
        status: input.status ?? null,
        wallet_address: input.wallet_address ?? null,
        agent_address: input.agent_address ?? null,
      }),
      credentials: "same-origin",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      console.warn(
        "[recordUserTransaction] failed",
        response.status,
        payload?.error ?? response.statusText,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[recordUserTransaction] error", err);
    return false;
  }
}
