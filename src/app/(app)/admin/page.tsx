import { PageHeader } from "@/components/app-shell/PageHeader";
import { AdminPageClient } from "@/components/admin/AdminPageClient";
import { requireAdminPageAccess } from "@/server/auth/authorization";

export default async function AdminPage() {
  await requireAdminPageAccess();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage the shared assistant system prompt and built-in tool policy from one guarded control plane without exposing any private user document content."
        eyebrow="Admin"
        title="Shared assistant control plane"
      />
      <AdminPageClient />
    </div>
  );
}
