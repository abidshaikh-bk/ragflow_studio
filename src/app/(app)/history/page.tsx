import { PageHeader } from "@/components/app-shell/PageHeader";
import { HistoryPageClient } from "@/components/history/HistoryPageClient";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Review the authenticated user's saved prompts, assistant replies, tool activity, and LangSmith-linked run ids from one audit-friendly workspace."
        eyebrow="History"
        title="Run history"
      />
      <HistoryPageClient />
    </div>
  );
}
