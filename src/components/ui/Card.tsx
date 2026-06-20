import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function Card({
  action,
  children,
  className,
  description,
  eyebrow,
  title,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur",
        className
      )}
      {...props}
    >
      {eyebrow || title || description || action ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-aqua">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-heading text-2xl font-semibold text-ice-white">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm leading-7 text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
