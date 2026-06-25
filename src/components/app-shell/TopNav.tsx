"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "./AppLogo";
import { getPrimaryNavItems, isNavItemActive } from "./navigation";
import { UserMenu } from "./UserMenu";

type TopNavProps = {
  isAdmin?: boolean;
  userEmail?: string;
};

export function TopNav({ isAdmin = false, userEmail }: TopNavProps) {
  const pathname = usePathname();
  const navItems = getPrimaryNavItems(isAdmin);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black-pearl/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <AppLogo size={44} />
            <div className="hidden min-[900px]:block">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-aqua">
                Protected workspace
              </p>
              <p className="text-sm text-slate-400">
                Private retrieval, history, and model controls
              </p>
            </div>
          </div>
          <span className="rounded-full border border-aqua/20 bg-aqua/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.28em] text-aqua min-[900px]:hidden">
            Workspace
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <nav
            aria-label="Primary"
            className="-mx-1 flex min-w-0 items-center gap-2 overflow-x-auto px-1 pb-1"
          >
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet text-white shadow-glow"
                      : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-aqua/50 hover:text-ice-white"
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
