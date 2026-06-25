import { PageHeader } from "@/components/app-shell/PageHeader";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage saved model defaults, masked provider credentials, and bring-your-own MCP connections from one authenticated workspace."
        eyebrow="Settings"
        title="Assistant configuration"
      />
      <SettingsPageClient />
    </div>
  );
}
