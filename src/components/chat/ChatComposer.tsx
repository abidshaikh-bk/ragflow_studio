"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ChatComposerProps = {
  onSubmit?: (message: string) => Promise<void> | void;
};

export function ChatComposer({ onSubmit }: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      setError("Ask a question about your indexed documents.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(message);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        error={error}
        label="Ask your documents"
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What does the onboarding guide say about approval flow?"
        value={message}
      />
      <Button className="w-full sm:w-auto" loading={loading} type="submit">
        Send
      </Button>
    </form>
  );
}
