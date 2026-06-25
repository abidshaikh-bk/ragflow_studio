import { DocumentsWorkspace } from "@/components/documents/DocumentsWorkspace";
import { PageHeader } from "@/components/app-shell/PageHeader";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Upload, process, and monitor the files that power user-scoped retrieval while keeping long-running status work contained inside the document workspace."
        eyebrow="Documents"
        title="Document ingestion workspace"
      />
      <DocumentsWorkspace />
    </div>
  );
}
