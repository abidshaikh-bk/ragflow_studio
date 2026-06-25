"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { shouldUseE2ELoginBypass } from "@/lib/e2e";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";

type LoginSubmitResult = {
  hardRedirect?: boolean;
  message: string;
  redirectTo: "/chat";
};

type LoginFormProps = {
  onSubmit?: (
    values: { email: string; password: string }
  ) => Promise<LoginSubmitResult> | LoginSubmitResult;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const router = useRouter();
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
      const submit = onSubmit ?? loginWithSupabase;
      const result = await submit({ email, password });
      const canUseHardRedirect =
        result.hardRedirect &&
        !globalThis.navigator.userAgent.toLowerCase().includes("jsdom");

      setSuccess(result.message);

      if (canUseHardRedirect) {
        globalThis.location.assign(result.redirectTo);
      } else {
        startTransition(() => {
          router.push(result.redirectTo);
        });
      }
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

async function loginWithSupabase(values: {
  email: string;
  password: string;
}): Promise<LoginSubmitResult> {
  if (shouldUseE2ELoginBypass()) {
    const bypassResult = await loginWithE2EBypass();

    if (bypassResult) {
      return bypassResult;
    }
  }

  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email.trim(),
    password: values.password
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    hardRedirect: true,
    message: "Signed in successfully. Redirecting to chat.",
    redirectTo: "/chat"
  };
}

async function loginWithE2EBypass(): Promise<LoginSubmitResult | null> {
  const response = await fetch("/api/e2e/login", {
    method: "POST"
  });
  const payload = (await response.json()) as {
    data?: {
      redirectTo?: "/chat";
    };
    error?: string;
  };

  if (response.status === 404 && payload.error === "Not found") {
    return null;
  }

  if (!response.ok || payload.data?.redirectTo !== "/chat") {
    throw new Error(payload.error || "Unable to log in right now.");
  }

  return {
    message: "Signed in successfully. Redirecting to chat.",
    redirectTo: "/chat"
  };
}
