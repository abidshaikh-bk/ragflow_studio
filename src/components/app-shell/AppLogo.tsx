import React from "react";
import Image from "next/image";
import Link from "next/link";

type AppLogoProps = {
  size?: number;
  withWordmark?: boolean;
};

export function AppLogo({
  size = 56,
  withWordmark = true
}: AppLogoProps) {
  return (
    <Link className="inline-flex items-center gap-4" href="/">
      <Image
        alt="RAGFlow Studio logo"
        className="rounded-2xl shadow-glow"
        height={size}
        priority
        src="/ragflow-logo.png"
        width={size}
      />
      {withWordmark ? (
        <span className="flex flex-col">
          <span className="font-heading text-lg font-semibold tracking-[0.28em] text-ice-white">
            RAGFLOW
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.42em] text-aqua">
            Studio
          </span>
        </span>
      ) : null}
    </Link>
  );
}
