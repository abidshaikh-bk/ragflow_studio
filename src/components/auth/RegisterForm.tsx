"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";

type RegisterFormProps = {
  onSubmit?: (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void> | void;
};

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Complete every field before creating your workspace.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match before continuing.");
      return;
    }

    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit({ email, password, confirmPassword });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      setSuccess("Account request submitted. Auth wiring lands in the next phase.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create your account right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <ErrorAlert message={error} title="Registration error" /> : null}
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
        autoComplete="new-password"
        hint="Use a password you can reuse during local MVP testing."
        label="Password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Create a password"
        type="password"
        value={password}
      />
      <Input
        autoComplete="new-password"
        label="Confirm password"
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Repeat your password"
        type="password"
        value={confirmPassword}
      />
      <Button className="w-full" loading={loading} type="submit">
        Create account
      </Button>
      <p className="text-sm text-slate-300">
        Already have an account?{" "}
        <Link className="text-aqua transition hover:text-ice-white" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
