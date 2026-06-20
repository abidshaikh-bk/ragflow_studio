import { ProtectedPagePlaceholder } from "@/components/app-shell/ProtectedPagePlaceholder";

export default function DocumentsPage() {
  return (
    <ProtectedPagePlaceholder
      description="This placeholder establishes the reusable protected shell for document ingestion, progress tracking, and history views."
      eyebrow="Documents"
      title="Document ingestion workspace"
    />
  );
}
