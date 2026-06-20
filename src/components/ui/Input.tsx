import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({
  className,
  error,
  hint,
  id,
  label,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <label className="flex flex-col gap-2" htmlFor={inputId}>
      <span className="text-sm font-medium text-ice-white">{label}</span>
      <input
        aria-describedby={cn(hint ? hintId : "", error ? errorId : "")}
        aria-invalid={error ? true : undefined}
        className={cn(
          "rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-ice-white outline-none transition placeholder:text-slate-500 focus-visible:border-aqua/70 focus-visible:ring-2 focus-visible:ring-aqua/30 disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-magenta/60 focus-visible:border-magenta/70" : "",
          className
        )}
        id={inputId}
        {...props}
      />
      {hint ? (
        <span className="text-xs text-slate-400" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="text-xs text-magenta" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
