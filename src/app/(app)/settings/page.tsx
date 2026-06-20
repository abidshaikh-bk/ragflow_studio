import { ProtectedPagePlaceholder } from "@/components/app-shell/ProtectedPagePlaceholder";

export default function SettingsPage() {
  return (
    <ProtectedPagePlaceholder
      description="The MVP shell is ready for a minimal settings surface once auth and server-backed configuration are wired in."
      eyebrow="Settings"
      title="Workspace settings"
    />
  );
}
