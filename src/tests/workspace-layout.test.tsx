import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

describe("workspace layout", () => {
  it("renders left, center, and right regions", () => {
    render(
      <WorkspaceLayout
        center={<div>Center content</div>}
        centerTitle="Workspace"
        leftContent={<div>Left content</div>}
        leftLabel="left rail"
        rightContent={<div>Right content</div>}
        rightLabel="right rail"
      />
    );

    expect(screen.getByLabelText("left rail")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace center panel")).toBeInTheDocument();
    expect(screen.getByLabelText("right rail")).toBeInTheDocument();
  });

  it("supports desktop collapse and expand controls", () => {
    render(
      <WorkspaceLayout
        center={<div>Center content</div>}
        centerTitle="Workspace"
        leftCollapsedSummary={<div>LC</div>}
        leftContent={<div>Left content</div>}
        leftLabel="left rail"
        rightCollapsedSummary={<div>RC</div>}
        rightContent={<div>Right content</div>}
        rightLabel="right rail"
      />
    );

    const leftRail = screen.getByLabelText("left rail");
    const rightRail = screen.getByLabelText("right rail");

    fireEvent.click(screen.getByRole("button", { name: /collapse left rail/i }));
    fireEvent.click(screen.getByRole("button", { name: /collapse right rail/i }));

    expect(leftRail).toHaveAttribute("data-collapsed", "true");
    expect(rightRail).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /expand left rail/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand right rail/i })).toBeInTheDocument();
  });

  it("opens and closes mobile drawer controls", () => {
    render(
      <WorkspaceLayout
        center={<div>Center content</div>}
        centerTitle="Workspace"
        leftContent={<div>Left content</div>}
        leftLabel="left rail"
        rightContent={<div>Right content</div>}
        rightLabel="right rail"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open left rail drawer/i }));
    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Left content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
