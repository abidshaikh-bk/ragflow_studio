import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";

export function SecretInput({
  error,
  hint,
  maskedValue,
  label,
  placeholder,
  ...props
}: {
  error?: string;
  hint?: string;
  label: string;
  placeholder: string;
  maskedValue?: string | null;
} & InputHTMLAttributes<HTMLInputElement>) {
  const effectiveHint =
    hint ??
    (maskedValue
      ? `Stored value on file: ${maskedValue}. Enter a new key only when you want to replace it.`
      : "Secrets stay server-side for MVP and are never returned raw.");

  return (
    <Input
      error={error}
      hint={effectiveHint}
      label={label}
      placeholder={placeholder}
      type="password"
      {...props}
    />
  );
}
