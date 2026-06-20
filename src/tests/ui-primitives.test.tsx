import React from "react";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

describe("shared ui primitives", () => {
  it("renders button states accessibly", () => {
    render(
      <>
        <Button>Primary action</Button>
        <Button disabled>Disabled action</Button>
      </>
    );

    expect(
      screen.getByRole("button", { name: /primary action/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disabled action/i })).toBeDisabled();
  });

  it("renders labeled form controls", () => {
    render(
      <>
        <Input label="Email" placeholder="name@example.com" />
        <Select
          label="Provider"
          options={[
            { label: "OpenAI", value: "openai" },
            { label: "Anthropic", value: "anthropic" }
          ]}
        />
      </>
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Provider")).toBeInTheDocument();
  });

  it("renders structural feedback components", () => {
    render(
      <>
        <Card title="System status">Live content</Card>
        <Badge>ready</Badge>
        <Progress label="Index progress" value={50} />
        <Toast message="Saved." title="Settings queued" />
        <EmptyState description="No documents yet." title="Empty documents" />
        <Spinner label="Loading data" />
        <ErrorAlert message="Something failed." />
      </>
    );

    expect(screen.getByText("System status")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /index progress/i })).toHaveAttribute(
      "aria-valuenow",
      "50"
    );
    expect(screen.getByRole("status", { name: /settings queued saved\./i })).toBeInTheDocument();
    expect(screen.getByText("Empty documents")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /loading data/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed.");
  });
});
