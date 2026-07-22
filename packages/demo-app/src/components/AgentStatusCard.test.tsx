import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentStatusCard } from "@/components/AgentStatusCard";

describe("AgentStatusCard", () => {
  it("shows disconnected registration state", () => {
    render(
      <AgentStatusCard
        agentAddress="0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
        isRunning={false}
        lastDecision={null}
        modelCommitment={null}
      />,
    );
    expect(screen.getByText("Not registered yet")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows running pipeline state", () => {
    render(
      <AgentStatusCard
        agentAddress="0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
        isRunning
        lastDecision={null}
        modelCommitment="0xabc"
      />,
    );
    expect(screen.getByText("Pipeline running")).toBeInTheDocument();
  });
});
