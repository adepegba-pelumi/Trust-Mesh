import { describe, expect, it } from "vitest";

import { sanitizeCreateTransactionBody } from "@/lib/transactions";

describe("sanitizeCreateTransactionBody", () => {
  const validHash = `0x${"ab".repeat(32)}`;

  it("accepts a valid create payload without user_id", () => {
    const result = sanitizeCreateTransactionBody({
      tx_hash: validHash,
      status: "executed",
      wallet_address: "0x1111111111111111111111111111111111111111",
      agent_address: "0x2222222222222222222222222222222222222222",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tx_hash).toBe(validHash);
      expect(result.data.status).toBe("executed");
    }
  });

  it("rejects client-supplied user_id (ownership spoofing)", () => {
    const result = sanitizeCreateTransactionBody({
      user_id: "00000000-0000-0000-0000-000000000099",
      tx_hash: validHash,
      status: "executed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/user_id/i);
    }
  });

  it("rejects invalid tx hashes", () => {
    expect(sanitizeCreateTransactionBody({ tx_hash: "0xabc" }).ok).toBe(false);
    expect(sanitizeCreateTransactionBody({ tx_hash: "not-a-hash" }).ok).toBe(false);
  });

  it("rejects empty or non-object bodies", () => {
    expect(sanitizeCreateTransactionBody(null).ok).toBe(false);
    expect(sanitizeCreateTransactionBody("x").ok).toBe(false);
  });
});

/**
 * RLS policy expectations (applied in supabase/migrations).
 * These are documented as executable assertions on the migration source so CI
 * catches accidental policy regressions without a live Supabase instance.
 */
describe("transactions RLS migration contract", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const migration = fs.readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20260907120000_create_transactions.sql",
    ),
    "utf8",
  );

  it("enables RLS and scopes select/insert/update/delete to auth.uid()", () => {
    expect(migration).toMatch(/enable row level security/i);
    expect(migration).toMatch(/for select[\s\S]*user_id = auth\.uid\(\)/i);
    expect(migration).toMatch(/for insert[\s\S]*with check \(user_id = auth\.uid\(\)\)/i);
    expect(migration).toMatch(/for update[\s\S]*using \(user_id = auth\.uid\(\)\)/i);
    expect(migration).toMatch(/for delete[\s\S]*using \(user_id = auth\.uid\(\)\)/i);
  });

  it("does not grant table access to anon", () => {
    expect(migration).toMatch(/revoke all on table public\.transactions from anon/i);
  });
});
