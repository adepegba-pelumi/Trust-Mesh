import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PipelineVisual } from "@/components/PipelineVisual";

describe("PipelineVisual", () => {
  it("renders idle controls and triggers demo run", () => {
    const onRunDemo = vi.fn();
    const onRunUnsafe = vi.fn();
    render(
      <PipelineVisual
        error={null}
        isRunning={false}
        onReset={() => undefined}
        onRunDemo={onRunDemo}
        onRunUnsafe={onRunUnsafe}
        pipelineState="idle"
        stageOrder={["observing", "inferring", "proving", "verifying", "executing"]}
        stageTimings={{}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run demo/i }));
    fireEvent.click(screen.getByRole("button", { name: /trigger unsafe/i }));
    expect(onRunDemo).toHaveBeenCalled();
    expect(onRunUnsafe).toHaveBeenCalled();
  });

  it("shows error state", () => {
    render(
      <PipelineVisual
        error="Pipeline failed"
        isRunning={false}
        onReset={() => undefined}
        onRunDemo={() => undefined}
        onRunUnsafe={() => undefined}
        pipelineState="error"
        stageOrder={["observing", "inferring", "proving", "verifying", "executing"]}
        stageTimings={{}}
      />,
    );
    expect(screen.getByText("Pipeline failed")).toBeInTheDocument();
  });
});
