import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  error?: string;
};

export function Select({
  className,
  error,
  id,
  label,
  options,
  ...props
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${selectId}-error`;

  return (
    <label className="flex flex-col gap-2" htmlFor={selectId}>
      <span className="text-sm font-medium text-ice-white">{label}</span>
      <select
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-ice-white outline-none transition focus-visible:border-aqua/70 focus-visible:ring-2 focus-visible:ring-aqua/30 disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-magenta/60" : "",
          className
        )}
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs text-magenta" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
