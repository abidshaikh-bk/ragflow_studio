import { Input } from "@/components/ui/Input";

export function SecretInput({
  label,
  placeholder
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <Input
      hint="Secrets stay server-side for MVP and are never returned raw."
      label={label}
      placeholder={placeholder}
      type="password"
      value="****************"
      disabled
      readOnly
    />
  );
}
