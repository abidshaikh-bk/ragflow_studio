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
        <AppLogo size={52} />
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold text-ice-white">
            {title}
          </h1>
          <p className="text-sm leading-7 text-slate-300">{description}</p>
        </div>
        {children}
        <div className="border-t border-white/10 pt-5 text-sm text-slate-300">
          {footer}
        </div>
      </div>
    </section>
  );
}
