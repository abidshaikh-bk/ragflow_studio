import React from "react";
import Link from "next/link";
import { AppLogo } from "../components/app-shell/AppLogo";

const foundations = [
  "Next.js App Router with TypeScript and Tailwind CSS",
  "Dark RAGFlow Studio visual baseline and shared folder structure",
  "Testing scripts for Vitest, Playwright, linting, and type checks"
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-hero-grid bg-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <AppLogo />
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link className="rounded-full border border-white/10 px-4 py-2 hover:border-aqua/60 hover:text-ice-white" href="/login">
              Login
            </Link>
            <Link className="rounded-full bg-violet px-4 py-2 font-medium text-white shadow-glow hover:bg-violet/90" href="/register">
              Get started
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex rounded-full border border-aqua/30 bg-aqua/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-aqua">
                Task 001 foundation
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl font-heading text-5xl font-semibold tracking-tight text-ice-white sm:text-6xl">
                  Build an authenticated document intelligence workspace with a fast MVP core.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  RAGFlow Studio turns private files into searchable knowledge so each user can upload, index, and chat with their own document set.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="rounded-full bg-violet px-5 py-3 font-medium text-white shadow-glow transition hover:bg-violet/90" href="/register">
                  Create your workspace
                </Link>
                <Link className="rounded-full border border-white/10 px-5 py-3 font-medium text-ice-white transition hover:border-aqua/60 hover:text-aqua" href="/login">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
                Included in this scaffold
              </p>
              <ul className="mt-6 space-y-4">
                {foundations.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-7 text-slate-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
