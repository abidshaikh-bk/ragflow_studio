import type { ReactNode } from "react";
import { AppLogo } from "@/components/app-shell/AppLogo";

type AuthCardProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthCard({
  children,
  description,
  footer,
  title
}: AuthCardProps) {
  return (
    <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-black/45 p-8 shadow-glow backdrop-blur-xl">
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AppLogo size={52} withWordmark={false} />
          <div className="space-y-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.42em] text-aqua">
              RAGFlow Studio
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-semibold text-ice-white">
                {title}
              </h1>
              <p className="text-sm leading-7 text-slate-300">{description}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {children}
        </div>
        <div className="border-t border-white/10 pt-5 text-center text-sm text-slate-300">
          {footer}
        </div>
      </div>
    </section>
  );
}
