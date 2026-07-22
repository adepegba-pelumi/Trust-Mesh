import { describe, expect, it } from "vitest";

import {
  formatModelCommitment,
  formatPublicInputs,
  normalizeCommitment,
  truncateHash,
} from "@/lib/format";

describe("format utilities", () => {
  it("truncates long hashes", () => {
    const hash = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateHash(hash)).toContain("…");
  });

  it("formats model commitment", () => {
    const value = "0x" + "ab".repeat(32);
    expect(formatModelCommitment(value)).toContain("0x");
  });

  it("normalizes commitment hex", () => {
    expect(normalizeCommitment("abcd")).toHaveLength(66);
  });

  it("formats public inputs with liquidity and concentration", () => {
    const label = formatPublicInputs([2_000n * 10n ** 18n, 2500n]);
    expect(label).toContain("liquidity");
    expect(label).toContain("concentration");
  });
});
