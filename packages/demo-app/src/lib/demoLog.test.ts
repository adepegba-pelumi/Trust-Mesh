import { describe, expect, it } from "vitest";

import { logToAuditRow } from "@/lib/demoLog";

describe("logToAuditRow", () => {
  it("maps happy path demo log to audit row", () => {
    const row = logToAuditRow(
      {
        scenarios: {
          happy_path: {
            public_inputs: [2_000 * 10 ** 18, 2500],
            verify: { tx_hash: "0xabc123", status: 1, block_number: 99 },
            verified_decision: {
              modelCommitment: "0xdead",
              timestamp: 1_700_000_000,
            },
          },
        },
      },
      "happy",
    );

    expect(row?.status).toBe("executed");
    expect(row?.transactionHash).toBe("0xabc123");
  });

  it("maps unsafe scenario revert", () => {
    const row = logToAuditRow(
      {
        scenarios: {
          constraint_violation: {
            public_inputs: [1000, 9999],
            verify: { error: "reverted" },
          },
        },
      },
      "unsafe",
    );

    expect(row?.status).toBe("reverted");
  });
});
