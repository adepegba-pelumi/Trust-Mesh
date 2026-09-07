export type TrustMeshUserTransaction = {
  id: string;
  user_id: string;
  wallet_address: string | null;
  tx_hash: string;
  status: string | null;
  agent_address: string | null;
  created_at: string;
};

/** Body accepted from the client — never includes user_id. */
export type CreateTransactionBody = {
  tx_hash: string;
  status?: string | null;
  wallet_address?: string | null;
  agent_address?: string | null;
};

const HEX_TX = /^0x[0-9a-fA-F]{64}$/;

export function sanitizeCreateTransactionBody(
  raw: unknown,
): { ok: true; data: CreateTransactionBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const body = raw as Record<string, unknown>;

  // Reject attempts to spoof ownership.
  if ("user_id" in body) {
    return { ok: false, error: "user_id cannot be supplied by the client." };
  }

  const txHash = typeof body.tx_hash === "string" ? body.tx_hash.trim() : "";
  if (!HEX_TX.test(txHash)) {
    return { ok: false, error: "tx_hash must be a 32-byte hex transaction hash." };
  }

  const status =
    body.status === undefined || body.status === null
      ? null
      : typeof body.status === "string"
        ? body.status.trim().slice(0, 64)
        : null;

  const wallet =
    typeof body.wallet_address === "string" && body.wallet_address.trim()
      ? body.wallet_address.trim()
      : null;
  const agent =
    typeof body.agent_address === "string" && body.agent_address.trim()
      ? body.agent_address.trim()
      : null;

  return {
    ok: true,
    data: {
      tx_hash: txHash,
      status,
      wallet_address: wallet,
      agent_address: agent,
    },
  };
}
