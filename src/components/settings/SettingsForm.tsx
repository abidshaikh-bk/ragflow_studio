import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProviderSelect } from "./ProviderSelect";
import { SaveBar } from "./SaveBar";
import { SecretInput } from "./SecretInput";

export function SettingsForm() {
  return (
    <div className="space-y-6">
      <Card
        eyebrow="Settings"
        title="Model configuration status"
        description="Phase 1A keeps this page read-only while showing the final layout and masked credential posture."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ProviderSelect label="Chat provider" value="openai" />
          <Input label="Chat model" value="gpt-4.1-mini" disabled readOnly />
          <SecretInput label="Chat API key" placeholder="Stored server-side" />
          <ProviderSelect label="Embedding provider" value="openai" />
          <Input label="Embedding model" value="text-embedding-3-small" disabled readOnly />
          <SecretInput
            label="Embedding API key"
            placeholder="Stored server-side"
          />
        </div>
      </Card>
      <SaveBar />
    </div>
  );
}
