import Link from "next/link";
import { EmptyState } from "../ui/EmptyState";

type ProtectedPagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ProtectedPagePlaceholder({
  eyebrow,
  title,
  description
}: ProtectedPagePlaceholderProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-aqua">
          {eyebrow}
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-ice-white">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-300">
          {description}
        </p>
      </section>

      <EmptyState
        action={
          <Link
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-ice-white transition hover:border-aqua/50 hover:text-aqua"
            href="/"
          >
            Return to landing page
          </Link>
        }
        description="This protected page is ready for the next task to connect real auth, page-specific content, and backend data."
        title="Shared shell is ready"
      />
    </div>
  );
}
