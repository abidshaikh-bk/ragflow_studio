import { ChatLayout } from "@/components/chat/ChatLayout";
import { listChatSessions } from "@/server/chat/persistence";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { createServerSupabaseClient } from "@/server/supabase/server";

export default async function ChatPage() {
  const user = await requireAuthenticatedUser();
  const supabase = await createServerSupabaseClient();
  const sessions = await listChatSessions(supabase, user.id);

  return <ChatLayout initialSessions={sessions} />;
}
