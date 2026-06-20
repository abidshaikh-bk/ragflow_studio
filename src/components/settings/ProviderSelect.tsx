import { Select } from "@/components/ui/Select";

const providerOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Gemini", value: "gemini" },
  { label: "Hugging Face", value: "huggingface" }
];

export function ProviderSelect({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return <Select label={label} options={providerOptions} value={value} disabled />;
}
