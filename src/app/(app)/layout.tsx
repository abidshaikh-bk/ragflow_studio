import { AppShell } from "@/components/app-shell/AppShell";
import { requireAuthenticatedUser } from "@/server/auth/session";

export default async function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuthenticatedUser();

  return <AppShell userEmail={user.email}>{children}</AppShell>;
}
