import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const variantClasses = {
  primary: "bg-violet text-white shadow-glow hover:bg-violet/90",
  secondary:
    "border border-aqua/40 bg-aqua/10 text-aqua hover:border-aqua/70 hover:bg-aqua/15",
  ghost:
    "border border-white/10 bg-white/5 text-ice-white hover:border-white/20 hover:bg-white/10"
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base"
};

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua focus-visible:ring-offset-2 focus-visible:ring-offset-black-pearl disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Spinner label="Loading" size="sm" /> : null}
      <span>{children}</span>
    </button>
  );
}
