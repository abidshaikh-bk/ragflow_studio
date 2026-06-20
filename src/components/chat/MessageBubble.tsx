import { Badge } from "@/components/ui/Badge";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

export function MessageBubble({
  content,
  role,
  sources
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <article
      className={`rounded-[1.5rem] border p-5 ${
        isUser
          ? "border-violet/40 bg-violet/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <Badge tone={isUser ? "info" : "default"}>{role}</Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-100">{content}</p>
      {sources?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {sources.map((source) => (
            <Badge key={source}>{source}</Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}
