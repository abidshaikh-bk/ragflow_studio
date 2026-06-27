import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLogo } from "@/components/app-shell/AppLogo";

const featureCards = [
  {
    description:
      "Upload private PDFs, notes, and operating docs, then turn them into a grounded chat workspace with citations.",
    icon: "layers",
    title: "Document intelligence without the setup drag"
  },
  {
    description:
      "Keep every workspace scoped to the signed-in user so teams can ask questions confidently without crossing document boundaries.",
    icon: "shield",
    title: "User-scoped answers that respect privacy"
  },
  {
    description:
      "Track uploads, chunking, embeddings, and answer context in one place so your team knows what the assistant is using.",
    icon: "spark",
    title: "Visible ingestion and grounded reasoning"
  }
] as const;

const problemCards = [
  "Teams lose time digging through folders, stale notes, and duplicated answers.",
  "Important decisions get slowed down when only a few people know where the right document lives.",
  "Generic AI chat feels risky when it cannot show what source it used or who can access it."
] as const;

const workflowSteps = [
  {
    label: "Upload",
    text: "Bring in PDFs, Markdown, TXT, and DOCX files from your private knowledge base."
  },
  {
    label: "Index",
    text: "RAGFlow Studio parses, chunks, embeds, and stores vectors with user-scoped retrieval."
  },
  {
    label: "Ask",
    text: "Start a conversation and get answers grounded in the exact document passages that matter."
  },
  {
    label: "Verify",
    text: "Open source chunks, inspect document state, and keep your team aligned on what the assistant knows."
  }
] as const;

const trustPoints = [
  "Private document storage and user-scoped retrieval",
  "Grounded answers with chunk-level citations",
  "Server-side secrets and protected auth flows"
] as const;

const footerLinks = [
  { href: "/", label: "Overview" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Create account" }
] as const;

function FeatureIcon({ name }: { name: "layers" | "shield" | "spark" }) {
  if (name === "layers") {
    return (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 3 4 7l8 4 8-4-8-4Zm-8 8 8 4 8-4M4 15l8 4 8-4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 3c2.4 2.1 5.5 3.2 8.7 3.3v5.2c0 4.7-2.8 8.9-7.2 10.6L12 22l-1.5-.7c-4.4-1.7-7.2-5.9-7.2-10.6V6.3C6.5 6.2 9.6 5.1 12 3Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path
          d="m9.5 12 1.7 1.7 3.6-3.9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2v5m0 10v5M4.9 4.9l3.5 3.5m7.2 7.2 3.5 3.5M2 12h5m10 0h5M4.9 19.1l3.5-3.5m7.2-7.2 3.5-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" fill="currentColor" r="2.4" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-ice-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(217,70,239,0.16),_transparent_24%),radial-gradient(circle_at_20%_80%,_rgba(6,182,212,0.18),_transparent_28%)]" />
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-70" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-3 text-sm text-slate-300"
          >
            <a
              className="rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-ice-white"
              href="#product"
            >
              Product
            </a>
            <a
              className="rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-ice-white"
              href="#workflow"
            >
              How it works
            </a>
            <a
              className="rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-ice-white"
              href="#trust"
            >
              Trust
            </a>
            <Link
              className="rounded-full border border-white/10 px-4 py-2 transition hover:border-aqua/60 hover:text-ice-white"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-full bg-violet px-4 py-2 font-medium text-white shadow-glow transition hover:bg-violet/90"
              href="/register"
            >
              Create account
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-aqua/30 bg-aqua/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-aqua">
              Trusted document intelligence for fast-moving teams
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-heading text-5xl font-semibold tracking-tight text-ice-white sm:text-6xl">
                Find the answer in your documents before the meeting starts.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                RAGFlow Studio turns scattered internal files into a private,
                searchable workspace so your team can ask better questions, cite
                the right source, and move with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-violet px-6 py-3 font-medium text-white shadow-glow transition hover:bg-violet/90"
                href="/register"
              >
                Start free workspace
              </Link>
              <Link
                className="rounded-full border border-white/10 px-6 py-3 font-medium text-ice-white transition hover:border-aqua/60 hover:text-aqua"
                href="/login"
              >
                Sign in
              </Link>
            </div>
            <ul className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-aqua/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-violet/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-glow backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ice-white">Live product view</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-aqua">
                    Chat grounded in private files
                  </p>
                </div>
                <div className="rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs text-emerald">
                  Verified sources
                </div>
              </div>
              <Image
                alt="RAGFlow Studio chat workspace showing a grounded answer with cited document sources"
                className="rounded-[1.5rem] border border-white/10"
                height={900}
                priority
                src="/landing/chat-workspace-snapshot.png"
                width={1440}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-3" id="problem">
          {problemCards.map((problem, index) => (
            <article
              key={problem}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur"
            >
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
                Problem 0{index + 1}
              </p>
              <p className="mt-4 text-base leading-7 text-slate-200">{problem}</p>
            </article>
          ))}
        </section>

        <section className="space-y-8 py-14" id="product">
          <div className="max-w-3xl space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
              Product snapshots
            </p>
            <h2 className="font-heading text-4xl font-semibold text-ice-white">
              See where answers, uploads, and trust signals come together.
            </h2>
            <p className="text-lg leading-8 text-slate-300">
              RAGFlow Studio gives teams one place to upload documents, monitor
              ingestion, and ask questions that point back to the source instead
              of hiding it.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-glow backdrop-blur-xl">
              <Image
                alt="RAGFlow Studio documents workspace showing upload progress and indexed document history"
                className="rounded-[1.5rem] border border-white/10"
                height={900}
                src="/landing/documents-workspace-snapshot.png"
                width={1440}
              />
              <div className="px-2 pb-2 pt-5">
                <h3 className="font-heading text-2xl font-semibold text-ice-white">
                  Upload and index with clear processing visibility
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Stage files, review processing status, and keep your knowledge
                  base current without losing sight of what was indexed.
                </p>
              </div>
            </article>
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-glow backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {featureCards.map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua/12 text-aqua">
                        <FeatureIcon name={feature.icon} />
                      </div>
                      <h3 className="mt-5 font-heading text-xl font-semibold text-ice-white">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-2 pb-2 pt-5">
                <h3 className="font-heading text-2xl font-semibold text-ice-white">
                  Built for teams that need both speed and proof
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Keep the answer fast, the evidence visible, and the workspace
                  scoped to the right user from the start.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="space-y-8 py-14" id="workflow">
          <div className="max-w-3xl space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
              How it works
            </p>
            <h2 className="font-heading text-4xl font-semibold text-ice-white">
              A straightforward workflow from raw files to grounded answers.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <article
                key={step.label}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6"
              >
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
                  Step 0{index + 1}
                </p>
                <h3 className="mt-4 font-heading text-2xl font-semibold text-ice-white">
                  {step.label}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.05] px-6 py-8 backdrop-blur-xl lg:grid-cols-[0.8fr_1.2fr]"
          id="trust"
        >
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
              Privacy and trust
            </p>
            <h2 className="font-heading text-4xl font-semibold text-ice-white">
              Document intelligence that does not ask you to trade away control.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              <h3 className="font-heading text-xl font-semibold text-ice-white">
                Private by default
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                User-scoped access, protected auth flows, and server-side secret
                handling keep the workspace aligned with MVP-safe privacy rules.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              <h3 className="font-heading text-xl font-semibold text-ice-white">
                Answers you can inspect
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Citation links and document views make it easier to verify what
                the assistant used before you share an answer with the team.
              </p>
            </article>
          </div>
        </section>

        <footer className="mt-14 flex flex-col gap-6 border-t border-white/10 py-8 text-sm text-slate-300 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <AppLogo />
            <p className="max-w-md leading-7">
              RAGFlow Studio helps teams turn private documents into grounded,
              searchable answers with a workflow that stays clear from upload to
              citation.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.href + link.label}
                className="transition hover:text-ice-white"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    </main>
  );
}
