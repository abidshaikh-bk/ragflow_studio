"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "./AppLogo";
import { UserMenu } from "./UserMenu";

const navItems = [
  { href: "/chat", label: "Chat" },
  { href: "/documents", label: "Documents" },
  { href: "/settings", label: "Settings" }
];

type TopNavProps = {
  userEmail?: string;
};

export function TopNav({ userEmail }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black-pearl/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-5">
          <AppLogo size={44} />
          <span className="rounded-full border border-aqua/20 bg-aqua/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.28em] text-aqua">
            Protected shell
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet text-white shadow-glow"
                      : "border border-white/10 text-slate-300 hover:border-aqua/50 hover:text-ice-white"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <UserMenu userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
