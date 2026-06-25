"use client";

import { useEffect, useMemo, useState } from "react";
import { GlobalMcpSettings } from "@/components/admin/GlobalMcpSettings";
import { SystemPromptEditor } from "@/components/admin/SystemPromptEditor";
import { ToolPolicyPanel } from "@/components/admin/ToolPolicyPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type SharedAssistantSettings = {
  systemPrompt: string;
  toolPolicy: {
    enableDateTime: boolean;
    enableVectorSearch: boolean;
    enableWebSearch: boolean;
  };
  updatedAt: string | null;
};

const defaultSettings: SharedAssistantSettings = {
  systemPrompt: "",
  toolPolicy: {
    enableDateTime: true,
    enableVectorSearch: true,
    enableWebSearch: true
  },
  updatedAt: null
};

export function AdminPageClient() {
  const [form, setForm] = useState<SharedAssistantSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/assistant", {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          data?: SharedAssistantSettings;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load the shared assistant settings.");
        }

        if (isMounted) {
          setForm(payload.data);
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the shared assistant settings."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const enabledToolCount = useMemo(
    () => Object.values(form.toolPolicy).filter(Boolean).length,
    [form.toolPolicy]
  );

  async function saveSettings() {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setSaveMessage("");

      const response = await fetch("/api/admin/assistant", {
        body: JSON.stringify(form),
        headers: {
          "content-type": "application/json"
        },
        method: "PUT"
      });
      const payload = (await response.json()) as {
        data?: SharedAssistantSettings;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to save the shared assistant settings.");
      }

      setForm(payload.data);
      setSaveMessage("Shared assistant settings saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the shared assistant settings."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <ErrorAlert
          message={errorMessage}
          title={isLoading ? "Unable to load admin controls" : "Unable to save admin controls"}
        />
      ) : null}

      {saveMessage ? (
        <div className="rounded-2xl border border-emerald/40 bg-emerald/10 px-4 py-3 text-sm text-emerald">
          {saveMessage}
        </div>
      ) : null}

      <Card
        action={
          <Button loading={isSaving} onClick={() => void saveSettings()}>
            Save shared assistant
          </Button>
        }
        description="Shape how the shared assistant behaves for every authenticated user without touching user-specific model credentials or private documents."
        eyebrow="Assistant"
        title="System prompt"
      >
        <SystemPromptEditor
          disabled={isLoading || isSaving}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              systemPrompt: value
            }))
          }
          value={form.systemPrompt}
        />
      </Card>

      <Card
        description="Disable built-in tools globally when you want the assistant to stay narrower, safer, or easier to audit."
        eyebrow="Policy"
        title="Built-in tool policy"
      >
        <ToolPolicyPanel
          disabled={isLoading || isSaving}
          onToggle={(key, value) =>
            setForm((current) => ({
              ...current,
              toolPolicy: {
                ...current.toolPolicy,
                [key]: value
              }
            }))
          }
          value={form.toolPolicy}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <GlobalMcpSettings />

        <Card
          description="Operational metadata only. This panel intentionally avoids user document contents, raw uploads, prompts, or secrets."
          eyebrow="Summary"
          title="Operations snapshot"
        >
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Built-in tools enabled
              </p>
              <p className="mt-2 text-3xl font-semibold text-ice-white">
                {enabledToolCount}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Prompt mode
              </p>
              <div className="mt-2">
                <Badge tone={form.systemPrompt.trim() ? "info" : "default"}>
                  {form.systemPrompt.trim() ? "Custom prompt active" : "Default prompt only"}
                </Badge>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Last updated
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {form.updatedAt ? new Date(form.updatedAt).toLocaleString() : "Not saved yet"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
