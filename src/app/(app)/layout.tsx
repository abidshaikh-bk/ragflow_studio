import { AppShell } from "@/components/app-shell/AppShell";
import { getAdminAccessState } from "@/server/auth/authorization";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { createServerSupabaseClient } from "@/server/supabase/server";

export default async function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuthenticatedUser();
  const supabase = await createServerSupabaseClient();
  const isAdmin = await getAdminAccessState({
    supabase,
    user
  });

  return (
    <AppShell isAdmin={isAdmin} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
