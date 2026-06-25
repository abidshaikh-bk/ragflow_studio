import type { DocumentChunkRecord } from "./types";

export function DocumentChunksTable({
  chunks,
  highlightedChunkIndex
}: {
  chunks: DocumentChunkRecord[];
  highlightedChunkIndex?: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">Chunk</th>
            <th className="px-4 py-3 font-medium">Preview</th>
            <th className="px-4 py-3 font-medium">Vector ID</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-black/20">
          {chunks.map((chunk) => (
            <tr
              className={chunk.chunkIndex === highlightedChunkIndex ? "bg-aqua/10" : undefined}
              id={`chunk-${chunk.chunkIndex + 1}`}
              key={chunk.id}
            >
              <td className="px-4 py-4 align-top">
                <p className="text-ice-white">Chunk {chunk.chunkIndex + 1}</p>
                <p className="mt-1 text-xs text-slate-400">{chunk.tokenCount} tokens</p>
              </td>
              <td className="px-4 py-4 align-top text-slate-300">{chunk.contentPreview}</td>
              <td className="px-4 py-4 align-top font-mono text-xs text-aqua">
                {chunk.pineconeVectorId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
