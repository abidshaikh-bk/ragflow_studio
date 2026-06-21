import { DocumentStatusBadge } from "./DocumentStatusBadge";
import type { DocumentRecord } from "./types";

type DocumentTableProps = {
  documents: DocumentRecord[];
};

export function DocumentTable({ documents }: DocumentTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-black/20">
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="px-4 py-4">
                <p className="text-ice-white">{document.name}</p>
                <p className="mt-1 text-xs text-slate-400">{document.updatedAt}</p>
                {document.errorMessage ? (
                  <p className="mt-2 text-xs text-magenta">{document.errorMessage}</p>
                ) : null}
              </td>
              <td className="px-4 py-4 text-slate-300">
                {document.status === "completed"
                  ? `${document.totalChunks} chunks indexed`
                  : `${document.processedChunks}/${document.totalChunks} chunks processed`}
              </td>
              <td className="px-4 py-4">
                <DocumentStatusBadge status={document.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
