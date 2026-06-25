import { ProtectedPagePlaceholder } from "@/components/app-shell/ProtectedPagePlaceholder";

export default function HistoryPage() {
  return (
    <ProtectedPagePlaceholder
      description="Review prior prompts, assistant replies, tool activity, and LangSmith-linked runs from one shared audit surface."
      eyebrow="History"
      title="Run history"
    />
  );
}
