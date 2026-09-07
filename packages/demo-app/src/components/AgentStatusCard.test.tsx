import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentDetailCard } from "@/components/AgentDetailCard";
import { DashboardStats } from "@/components/DashboardStats";

describe("DashboardStats", () => {
  it("shows Ready with green accent when idle", () => {
    render(
      <DashboardStats
        decisionsVerified={0}
        isRunning={false}
        medianProofTime="—"
        modelCommitment={null}
      />,
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows Running when pipeline is active", () => {
    render(
      <DashboardStats
        decisionsVerified={2}
        isRunning
        medianProofTime="<12s"
        modelCommitment="0xabc"
      />,
    );
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("AgentDetailCard", () => {
  it("shows disconnected registration state", () => {
    render(
      <AgentDetailCard
        agentAddress="0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
        isRunning={false}
        lastDecision={null}
        modelCommitment={null}
      />,
    );
    expect(screen.getByText("Not registered yet")).toBeInTheDocument();
    expect(screen.getByText("No verified decisions yet")).toBeInTheDocument();
  });

  it("shows running pipeline state", () => {
    render(
      <AgentDetailCard
        agentAddress="0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
        isRunning
        lastDecision={null}
        modelCommitment="0xabc"
      />,
    );
    expect(screen.getByText("Pipeline running")).toBeInTheDocument();
  });
});
