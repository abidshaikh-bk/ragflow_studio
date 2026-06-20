"use client";

import { useEffect, useState } from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
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
  embeddingModel: string;
  embeddingProvider: string;
};

const defaultSettings: SettingsResponse = {
  chatApiKeyMasked: null,
  chatModel: "gpt-4.1-mini",
  chatProvider: "openai",
  embeddingApiKeyMasked: null,
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
    <div className="space-y-4">
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
          embeddingModel: settings.embeddingModel,
          embeddingProvider: settings.embeddingProvider
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
