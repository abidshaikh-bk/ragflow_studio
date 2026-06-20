import { DocumentDropzone } from "@/components/documents/DocumentDropzone";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ProcessingTimeline } from "@/components/documents/ProcessingTimeline";
import { UploadProgressCard } from "@/components/documents/UploadProgressCard";
import { Card } from "@/components/ui/Card";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <Card
        eyebrow="Documents"
        title="Document ingestion workspace"
        description="Upload, process, and track the files that power user-scoped retrieval."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <DocumentDropzone />
          <Card
            eyebrow="History"
            title="Indexed document list"
            description="Placeholder document records show the intended table shape for the next ingestion tasks."
          >
            <DocumentTable />
          </Card>
        </div>
        <div className="space-y-6">
          <UploadProgressCard />
          <Card
            eyebrow="Stages"
            title="Processing timeline"
            description="This list matches the planned ingestion status model."
          >
            <ProcessingTimeline />
          </Card>
        </div>
      </div>
    </div>
  );
}
