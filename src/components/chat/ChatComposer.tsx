"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ChatComposerProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onSubmit?: (message: string) => Promise<void> | void;
};

export function ChatComposer({
  disabled = false,
  isLoading = false,
  onSubmit
}: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || isLoading) {
      return;
    }

    if (!message.trim()) {
      setError("Ask a question about your indexed documents.");
      return;
    }

    setError("");

    try {
      if (onSubmit) {
        await onSubmit(message);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      setMessage("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your question right now."
      );
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        disabled={disabled || isLoading}
        error={error}
        label="Ask your documents"
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What does the onboarding guide say about approval flow?"
        value={message}
      />
      <Button
        className="w-full sm:w-auto"
        disabled={disabled}
        loading={isLoading}
        type="submit"
      >
        Send
      </Button>
    </form>
  );
}
