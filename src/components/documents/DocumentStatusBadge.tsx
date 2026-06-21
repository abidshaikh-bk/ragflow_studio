import { Badge } from "@/components/ui/Badge";
import type { DocumentStatus } from "./types";

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
