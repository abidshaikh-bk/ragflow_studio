import { ProtectedPagePlaceholder } from "@/components/app-shell/ProtectedPagePlaceholder";
import { requireAdminPageAccess } from "@/server/auth/authorization";

export default async function AdminPage() {
  await requireAdminPageAccess();

  return (
    <ProtectedPagePlaceholder
      description="Shared assistant controls, built-in tool policy, and global MCP management will live here for admins in the next phase."
      eyebrow="Admin"
      title="Shared assistant control plane"
    />
  );
}
