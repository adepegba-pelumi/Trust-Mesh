import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditTrail } from "@/components/AuditTrail";

describe("AuditTrail", () => {
  it("renders loading state", () => {
    render(<AuditTrail isLoading rows={[]} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders audit rows", () => {
    render(
      <AuditTrail
        isLoading={false}
        rows={[
          {
            id: "1",
            timestamp: 1_700_000_000,
            modelCommitment: "0xabc",
            publicInputs: [1000n, 2500n],
            publicInputsLabel: "liquidity: test",
            status: "executed",
            transactionHash: "0xdeadbeef",
            blockNumber: 123,
            source: "chain",
          },
        ]}
      />,
    );
    expect(screen.getByText(/liquidity: test/i)).toBeInTheDocument();
  });
});
