import { DocumentStatusBadge } from "./DocumentStatusBadge";

const documents = [
  { id: "d1", name: "employee-handbook.md", chunks: "24 chunks", status: "completed" },
  { id: "d2", name: "security-policy.txt", chunks: "16 chunks", status: "indexing" },
  { id: "d3", name: "pricing-overview.pdf", chunks: "Queued", status: "uploaded" }
] as const;

export function DocumentTable() {
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
              <td className="px-4 py-4 text-ice-white">{document.name}</td>
              <td className="px-4 py-4 text-slate-300">{document.chunks}</td>
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
