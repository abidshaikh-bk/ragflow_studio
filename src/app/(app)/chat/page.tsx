import { ChatLayout } from "@/components/chat/ChatLayout";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { getE2EAuthenticatedUser, getE2EStateId } from "@/server/auth/e2e";
import { listChatSessions } from "@/server/chat/persistence";
import { listE2EChatSessions } from "@/server/e2e/chat-store";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { createServerSupabaseClient } from "@/server/supabase/server";

export default async function ChatPage() {
  const user = await requireAuthenticatedUser();

  if (await getE2EAuthenticatedUser()) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="Search your private document set, review sources, and keep tool activity visible while you work through each session."
          eyebrow="Chat"
          title="Agentic RAG workspace"
        />
        <ChatLayout
          initialSessions={listE2EChatSessions((await getE2EStateId()) ?? "default")}
        />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const sessions = await listChatSessions(supabase, user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Search your private document set, review sources, and keep tool activity visible while you work through each session."
        eyebrow="Chat"
        title="Agentic RAG workspace"
      />
      <ChatLayout initialSessions={sessions} />
    </div>
  );
}
