import { Badge } from "@/components/ui/Badge";

type DocumentStatus =
  | "uploaded"
  | "parsing"
  | "chunking"
  | "embedding"
  | "indexing"
  | "completed"
  | "failed";

const toneByStatus: Record<DocumentStatus, "default" | "success" | "warning" | "info"> = {
  uploaded: "default",
  parsing: "info",
  chunking: "info",
  embedding: "info",
  indexing: "info",
  completed: "success",
  failed: "warning"
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={toneByStatus[status]}>{status}</Badge>;
}
