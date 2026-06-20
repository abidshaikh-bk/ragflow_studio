import { AppShell } from "@/components/app-shell/AppShell";

export default function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
