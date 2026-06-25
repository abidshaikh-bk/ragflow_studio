import { ProtectedPagePlaceholder } from "@/components/app-shell/ProtectedPagePlaceholder";

export default function AdminPage() {
  return (
    <ProtectedPagePlaceholder
      description="Shared assistant controls, built-in tool policy, and global MCP management will live here for admins in the next phase."
      eyebrow="Admin"
      title="Shared assistant control plane"
    />
  );
}
