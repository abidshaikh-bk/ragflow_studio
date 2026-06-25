import { PageHeader } from "@/components/app-shell/PageHeader";
import { DocumentDetailPage } from "@/components/documents/DocumentDetailPage";

export default async function DocumentDetailRoute({
  params
}: {
  params: Promise<{
    documentId: string;
  }>;
}) {
  const { documentId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Inspect the private file record, chunking strategy, and embedding/index metadata that power document retrieval for this upload."
        eyebrow="Documents"
        title="Document explorer"
      />
      <DocumentDetailPage documentId={documentId} />
    </div>
  );
}
