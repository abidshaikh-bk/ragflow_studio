import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import type { DocumentRecord } from "./types";

type DocumentTableProps = {
  documents: DocumentRecord[];
  onRequestAccessLink: (documentId: string, action: "download" | "view") => void;
  requestingAccessForId?: string | null;
};

export function DocumentTable({
  documents,
  onRequestAccessLink,
  requestingAccessForId
}: DocumentTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Pipeline</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-black/20">
          {documents.map((document) => {
            const isRequesting = requestingAccessForId === document.id;

            return (
              <tr key={document.id}>
                <td className="px-4 py-4 align-top">
                  <Link
                    className="font-medium text-ice-white transition hover:text-aqua"
                    href={`/documents/${document.id}`}
                  >
                    {document.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">{document.updatedAt}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {document.fileType || "Unknown type"}
                    {document.fileSize ? ` • ${formatFileSize(document.fileSize)}` : ""}
                  </p>
                  {document.errorMessage ? (
                    <p className="mt-2 text-xs text-magenta">{document.errorMessage}</p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-slate-300">
                  <p>
                    {document.status === "completed"
                      ? `${document.totalChunks} chunks indexed`
                      : `${document.processedChunks}/${document.totalChunks} chunks processed`}
                  </p>
                  {document.indexingState ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {document.indexingState.vectorCount} vectors
                      {document.indexingState.provider
                        ? ` via ${document.indexingState.provider}`
                        : ""}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top">
                  <DocumentStatusBadge status={document.status} />
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRequestAccessLink(document.id, "view")}
                      loading={isRequesting}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onRequestAccessLink(document.id, "download")}
                      loading={isRequesting}
                    >
                      Download
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}
