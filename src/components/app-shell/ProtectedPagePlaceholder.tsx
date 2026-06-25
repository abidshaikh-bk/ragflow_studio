import Link from "next/link";
import { PageHeader } from "./PageHeader";
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
      <PageHeader description={description} eyebrow={eyebrow} title={title} />

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
