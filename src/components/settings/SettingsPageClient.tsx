"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { McpToolsSettings } from "./McpToolsSettings";
import {
  SettingsForm,
  type SettingsFormSavedState,
  type SettingsFormValues
} from "./SettingsForm";

type SettingsResponse = {
  chatApiKeyMasked: string | null;
  chatModel: string;
  chatProvider: string;
  embeddingApiKeyMasked: string | null;
  embeddingDimensions: number;
  embeddingModel: string;
  embeddingProvider: string;
};

const defaultSettings: SettingsResponse = {
  chatApiKeyMasked: null,
  chatModel: "gpt-4.1-mini",
  chatProvider: "openai",
  embeddingApiKeyMasked: null,
  embeddingDimensions: 1024,
  embeddingModel: "text-embedding-3-small",
  embeddingProvider: "openai"
};

export function SettingsPageClient() {
  const [settings, setSettings] = useState<SettingsResponse>(defaultSettings);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      if (!globalThis.fetch) {
        return;
      }

      try {
        const response = await fetch("/api/settings", {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          data?: SettingsResponse;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load your saved settings.");
        }

        if (isMounted) {
          setSettings(payload.data);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load your saved settings."
          );
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(
    values: SettingsFormValues
  ): Promise<SettingsFormSavedState> {
    const response = await fetch("/api/settings", {
      body: JSON.stringify(values),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json()) as {
      data?: SettingsResponse;
      error?: string;
    };

    if (!response.ok || !payload.data) {
      throw new Error(payload.error || "Unable to save your settings right now.");
    }

    setSettings(payload.data);

    return {
      chatApiKeyMasked: payload.data.chatApiKeyMasked,
      embeddingApiKeyMasked: payload.data.embeddingApiKeyMasked,
      message: "Settings saved. Stored secrets remain masked."
    };
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-5 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,34,0.96),rgba(7,12,24,0.92))] p-5 shadow-glow">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-violet/90">
            Settings
          </p>
          <h2 className="font-heading text-xl font-semibold text-ice-white">
            Configuration areas
          </h2>
          <p className="text-sm leading-6 text-slate-400">
            Start with models and MCP, then expand into workspace controls later.
          </p>
        </div>
        <nav aria-label="Settings sections" className="space-y-3">
          <SettingsRailItem
            description="Configure AI models and MCP"
            isActive
            title="Model & MCP"
          />
          <SettingsRailItem
            description="General workspace settings"
            title="Workspace"
          />
          <SettingsRailItem description="API keys, secrets & access" title="Security" />
          <SettingsRailItem description="Usage, plan & limits" title="Billing" />
          <SettingsRailItem
            description="External tools and service links"
            title="Integrations"
          />
        </nav>
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="font-heading text-lg text-ice-white">Need help?</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Model IDs, embedding dimensions, and MCP secrets stay server-side after
            save.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs font-medium text-violet">
            Secure by default
          </div>
        </section>
      </aside>

      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ice-white sm:text-4xl">
            Model & MCP configuration
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Configure the chat model, embedding stack, and bring-your-own MCP
            servers used across your authenticated workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge tone="success">Secrets masked</Badge>
            <Badge tone="info">Server-side encryption</Badge>
          </div>
        </section>

        {loadError ? (
          <ErrorAlert
            message={loadError}
            title="Saved settings unavailable"
          />
        ) : null}

        <SettingsForm
          initialMaskedSecrets={{
            chatApiKey: settings.chatApiKeyMasked,
            embeddingApiKey: settings.embeddingApiKeyMasked
          }}
          initialValues={{
            chatModel: settings.chatModel,
            chatProvider: settings.chatProvider,
            embeddingDimensions: settings.embeddingDimensions,
            embeddingModel: settings.embeddingModel,
            embeddingProvider: settings.embeddingProvider
          }}
          onSubmit={handleSubmit}
        />

        <McpToolsSettings
          description="Connect user-scoped MCP servers for later-phase tool use without exposing stored headers or env secrets in the browser."
          emptyDescription="No MCP servers configured yet. Add an HTTP or stdio server when you want to extend the assistant with your own tools."
          eyebrow="Bring your own MCP"
          title="MCP server connections"
        />

        <section className="flex flex-col gap-4 rounded-[1.75rem] border border-violet/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(5,8,22,0.72))] px-5 py-5 shadow-glow sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-2">
            <p className="font-heading text-xl font-semibold text-ice-white">
              Your secrets are encrypted and stored securely.
            </p>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Saved provider keys and MCP secrets remain masked in the UI and are
              only decrypted inside trusted server helpers when a runtime call needs
              them.
            </p>
          </div>
          <Badge tone="success" className="justify-center">
            Protected
          </Badge>
        </section>
      </div>
    </div>
  );
}

function SettingsRailItem({
  description,
  isActive = false,
  title
}: {
  description: string;
  isActive?: boolean;
  title: string;
}) {
  return (
    <div
      className={
        isActive
          ? "rounded-[1.5rem] border border-violet/40 bg-violet/12 p-4 shadow-[0_0_30px_rgba(124,58,237,0.18)]"
          : "rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-heading text-lg font-medium text-ice-white">{title}</p>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {isActive ? <Badge tone="info">Active</Badge> : null}
      </div>
    </div>
  );
}
