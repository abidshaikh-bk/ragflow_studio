import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Toast } from "@/components/ui/Toast";

export function UploadProgressCard() {
  return (
    <Card
      eyebrow="Live processing"
      title="Pipeline status"
      description="Uploaded files will move through parsing, chunking, embedding, and indexing here."
    >
      <div className="space-y-5">
        <Progress label="Upload progress" value={82} />
        <Progress label="Chunk embedding" max={24} value={16} />
        <Toast
          message="Document ingestion events and retries will surface in this area."
          title="Pipeline ready for backend wiring"
        />
      </div>
    </Card>
  );
}
