"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { WorkspaceIcon } from "./icons";

type WorkspaceLayoutProps = {
  center: ReactNode;
  centerClassName?: string;
  centerScrollable?: boolean;
  centerTitle: string;
  leftCollapsedSummary?: ReactNode;
  leftContent: ReactNode;
  leftLabel: string;
  rightCollapsedSummary?: ReactNode;
  rightContent: ReactNode;
  rightLabel: string;
};

export function WorkspaceLayout({
  center,
  centerClassName,
  centerScrollable = true,
  centerTitle,
  leftCollapsedSummary,
  leftContent,
  leftLabel,
  rightCollapsedSummary,
  rightContent,
  rightLabel
}: WorkspaceLayoutProps) {
  const leftDrawerId = useId();
  const rightDrawerId = useId();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"left" | "right" | null>(null);

  return (
    <section className="flex min-h-[calc(100vh-12rem)] flex-col rounded-[1.75rem] border border-white/10 bg-black/25 shadow-[0_20px_80px_rgba(5,8,22,0.55)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Button
            aria-controls={leftDrawerId}
            aria-expanded={mobileDrawer === "left"}
            className="lg:hidden"
            onClick={() => setMobileDrawer((current) => (current === "left" ? null : "left"))}
            size="sm"
            type="button"
            variant="ghost"
          >
            <WorkspaceIcon name="menu" />
            <span className="sr-only">Open {leftLabel} drawer</span>
          </Button>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-aqua">
              Workspace
            </p>
            <h1 className="font-heading text-lg text-ice-white sm:text-xl">
              {centerTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            aria-controls={rightDrawerId}
            aria-expanded={mobileDrawer === "right"}
            className="lg:hidden"
            onClick={() => setMobileDrawer((current) => (current === "right" ? null : "right"))}
            size="sm"
            type="button"
            variant="ghost"
          >
            <WorkspaceIcon name="sparkles" />
            <span className="sr-only">Open {rightLabel} drawer</span>
          </Button>
          <div className="hidden items-center gap-2 lg:flex">
            <RailToggleButton
              collapsed={isLeftCollapsed}
              label={leftLabel}
              onClick={() => setIsLeftCollapsed((current) => !current)}
              side="left"
            />
            <RailToggleButton
              collapsed={isRightCollapsed}
              label={rightLabel}
              onClick={() => setIsRightCollapsed((current) => !current)}
              side="right"
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 p-3 sm:p-4">
        <WorkspaceRail
          ariaLabel={leftLabel}
          collapsed={isLeftCollapsed}
          collapsedSummary={leftCollapsedSummary}
          className="hidden lg:flex"
          side="left"
        >
          {leftContent}
        </WorkspaceRail>

        <div
          aria-label={`${centerTitle} center panel`}
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20",
            centerClassName
          )}
        >
          {centerScrollable ? (
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
              {center}
            </div>
          ) : (
            <div className="min-h-0 flex-1 p-3 sm:p-4">{center}</div>
          )}
        </div>

        <WorkspaceRail
          ariaLabel={rightLabel}
          collapsed={isRightCollapsed}
          collapsedSummary={rightCollapsedSummary}
          className="hidden lg:flex"
          side="right"
        >
          {rightContent}
        </WorkspaceRail>
      </div>

      {mobileDrawer ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex bg-black/70 p-3 backdrop-blur-sm lg:hidden"
          role="dialog"
        >
          <div
            className={cn(
              "flex h-full w-[min(22rem,100%)] flex-col rounded-[1.5rem] border border-white/10 bg-[#071024] shadow-glow",
              mobileDrawer === "right" ? "ml-auto" : ""
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-heading text-base text-ice-white">
                {mobileDrawer === "left" ? leftLabel : rightLabel}
              </p>
              <Button onClick={() => setMobileDrawer(null)} size="sm" type="button" variant="ghost">
                Close
              </Button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto p-3"
              id={mobileDrawer === "left" ? leftDrawerId : rightDrawerId}
            >
              {mobileDrawer === "left" ? leftContent : rightContent}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function WorkspaceRail({
  ariaLabel,
  children,
  className,
  collapsed,
  collapsedSummary,
  side
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  collapsed: boolean;
  collapsedSummary?: ReactNode;
  side: "left" | "right";
}) {
  return (
    <aside
      aria-label={ariaLabel}
      className={cn(
        "min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 transition-all duration-200",
        collapsed ? "w-[88px]" : "w-[300px]",
        className
      )}
      data-collapsed={collapsed ? "true" : "false"}
      data-side={side}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
        {collapsed ? (
          <div className="flex h-full flex-col items-center justify-start gap-3 pt-1">
            {collapsedSummary}
          </div>
        ) : (
          children
        )}
      </div>
    </aside>
  );
}

function RailToggleButton({
  collapsed,
  label,
  onClick,
  side
}: {
  collapsed: boolean;
  label: string;
  onClick: () => void;
  side: "left" | "right";
}) {
  const iconName =
    side === "left"
      ? collapsed
        ? "chevronRight"
        : "chevronLeft"
      : collapsed
        ? "chevronLeft"
        : "chevronRight";

  return (
    <Button
      aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
      onClick={onClick}
      size="sm"
      type="button"
      variant="ghost"
    >
      <WorkspaceIcon name={iconName} />
      <span>{collapsed ? `Show ${label}` : `Hide ${label}`}</span>
    </Button>
  );
}
