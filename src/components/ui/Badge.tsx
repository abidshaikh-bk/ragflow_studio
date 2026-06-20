import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "info";
};

const toneClasses = {
  default: "border-white/10 bg-white/5 text-slate-200",
  success: "border-emerald/30 bg-emerald/10 text-emerald",
  warning: "border-magenta/30 bg-magenta/10 text-magenta",
  info: "border-aqua/30 bg-aqua/10 text-aqua"
};

export function Badge({
  children,
  className,
  tone = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em]",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
