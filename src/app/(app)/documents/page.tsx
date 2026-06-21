import { DocumentsWorkspace } from "@/components/documents/DocumentsWorkspace";
import { Card } from "@/components/ui/Card";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <Card
        eyebrow="Documents"
        title="Document ingestion workspace"
        description="Upload, process, and track the files that power user-scoped retrieval."
      />
      <DocumentsWorkspace />
    </div>
  );
}
