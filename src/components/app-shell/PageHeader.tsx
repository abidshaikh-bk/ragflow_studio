import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  title: string;
};

export function PageHeader({
  action,
  className,
  description,
  eyebrow,
  title
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 py-6 shadow-glow backdrop-blur sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8",
        className
      )}
    >
      <div className="max-w-3xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ice-white sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
