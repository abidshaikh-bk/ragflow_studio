"use client";

import { useEffect, useState } from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";
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
  const [activeTab, setActiveTab] = useState<"models" | "mcp-tools">("models");

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
    <div className="space-y-4">
      <div
        aria-label="Settings sections"
        className="flex flex-wrap gap-3"
        role="tablist"
      >
        <Button
          aria-selected={activeTab === "models"}
          onClick={() => setActiveTab("models")}
          role="tab"
          variant={activeTab === "models" ? "secondary" : "ghost"}
        >
          Models
        </Button>
        <Button
          aria-selected={activeTab === "mcp-tools"}
          onClick={() => setActiveTab("mcp-tools")}
          role="tab"
          variant={activeTab === "mcp-tools" ? "secondary" : "ghost"}
        >
          MCP Tools
        </Button>
      </div>
      {loadError ? (
        <ErrorAlert
          message={loadError}
          title="Saved settings unavailable"
        />
      ) : null}
      {activeTab === "models" ? (
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
      ) : (
        <McpToolsSettings />
      )}
    </div>
  );
}
