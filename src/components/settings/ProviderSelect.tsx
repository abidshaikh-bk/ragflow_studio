import type { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/Select";

export const providerOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Gemini", value: "gemini" },
  { label: "Hugging Face", value: "huggingface" }
];

export function ProviderSelect({
  error,
  label,
  value,
  ...props
}: {
  error?: string;
  label: string;
  value: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Select
      error={error}
      label={label}
      options={providerOptions}
      value={value}
      {...props}
    />
  );
}
