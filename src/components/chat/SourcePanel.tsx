import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { ChatCitation } from "./types";

type SourcePanelProps = {
  citations: ChatCitation[];
};

export function SourcePanel({ citations }: SourcePanelProps) {
  if (citations.length === 0) {
    return (
      <Card eyebrow="Context" title="Sources">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
          Retrieved document chunks will appear here after the assistant answers.
        </div>
      </Card>
    );
  }

  return (
    <Card eyebrow="Context" title="Sources">
      <div className="space-y-3">
        {citations.map((citation, index) => (
          <div
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            key={`${citation.fileName}-${citation.chunkIndex ?? index}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-ice-white">
                {citation.sourceType === "document" && citation.chunkIndex != null
                  ? `${citation.fileName} · chunk ${citation.chunkIndex + 1}`
                  : citation.fileName}
              </p>
              {citation.linkTarget ? (
                citation.linkTarget.startsWith("/") ? (
                  <Link
                    className="text-xs text-aqua transition hover:text-aqua/80"
                    href={citation.linkTarget}
                  >
                    Open
                  </Link>
                ) : (
                  <a
                    className="text-xs text-aqua transition hover:text-aqua/80"
                    href={citation.linkTarget}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open
                  </a>
                )
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-300">{citation.contentPreview}</p>
            {citation.retrievalScore != null ? (
              <p className="mt-2 text-xs text-slate-500">
                Score {citation.retrievalScore.toFixed(2)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
