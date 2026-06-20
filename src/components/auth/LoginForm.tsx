"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";

type LoginFormProps = {
  onSubmit?: (values: { email: string; password: string }) => Promise<void> | void;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Enter both your email and password to continue.");
      return;
    }

    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit({ email, password });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      setSuccess("Credentials submitted. Supabase wiring lands in the next phase.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to log in right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <ErrorAlert message={error} title="Login error" /> : null}
      {success ? (
        <p className="rounded-2xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">
          {success}
        </p>
      ) : null}
      <Input
        autoComplete="email"
        label="Email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@company.com"
        type="email"
        value={email}
      />
      <Input
        autoComplete="current-password"
        label="Password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter your password"
        type="password"
        value={password}
      />
      <Button className="w-full" loading={loading} type="submit">
        Log in
      </Button>
      <p className="text-sm text-slate-300">
        New here?{" "}
        <Link className="text-aqua transition hover:text-ice-white" href="/register">
          Create account
        </Link>
      </p>
    </form>
  );
}
