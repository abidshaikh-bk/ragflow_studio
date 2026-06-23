import { ChatLayout } from "@/components/chat/ChatLayout";
import { getE2EAuthenticatedUser, getE2EStateId } from "@/server/auth/e2e";
import { listChatSessions } from "@/server/chat/persistence";
import { listE2EChatSessions } from "@/server/e2e/chat-store";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { createServerSupabaseClient } from "@/server/supabase/server";

export default async function ChatPage() {
  const user = await requireAuthenticatedUser();

  if (await getE2EAuthenticatedUser()) {
    return (
      <ChatLayout initialSessions={listE2EChatSessions((await getE2EStateId()) ?? "default")} />
    );
  }

  const supabase = await createServerSupabaseClient();
  const sessions = await listChatSessions(supabase, user.id);

  return <ChatLayout initialSessions={sessions} />;
}
