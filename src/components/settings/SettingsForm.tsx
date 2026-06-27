"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { ProviderSelect } from "./ProviderSelect";
import { SaveBar } from "./SaveBar";
import { SecretInput } from "./SecretInput";

export type SettingsFormValues = {
  chatApiKey: string;
  chatModel: string;
  chatProvider: string;
  embeddingApiKey: string;
  embeddingDimensions: number;
  embeddingModel: string;
  embeddingProvider: string;
};

export type SettingsFormSavedState = {
  chatApiKeyMasked?: string | null;
  embeddingApiKeyMasked?: string | null;
  message?: string;
};

type SettingsFormProps = {
  initialValues?: Partial<SettingsFormValues>;
  initialMaskedSecrets?: {
    chatApiKey?: string | null;
    embeddingApiKey?: string | null;
  };
  onSubmit?: (
    values: SettingsFormValues
  ) => Promise<SettingsFormSavedState | void> | SettingsFormSavedState | void;
};

const defaultValues: SettingsFormValues = {
  chatApiKey: "",
  chatModel: "gpt-4.1-mini",
  chatProvider: "openai",
  embeddingApiKey: "",
  embeddingDimensions: 1024,
  embeddingModel: "text-embedding-3-small",
  embeddingProvider: "openai"
};

type FieldErrors = Partial<Record<keyof SettingsFormValues, string>>;

export function SettingsForm({
  initialMaskedSecrets,
  initialValues,
  onSubmit
}: SettingsFormProps) {
  const [values, setValues] = useState<SettingsFormValues>({
    ...defaultValues,
    ...initialValues
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [maskedSecrets, setMaskedSecrets] = useState({
    chatApiKey: initialMaskedSecrets?.chatApiKey ?? null,
    embeddingApiKey: initialMaskedSecrets?.embeddingApiKey ?? null
  });

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setValues((current) => ({
      ...current,
      ...initialValues,
      chatApiKey: "",
      embeddingApiKey: ""
    }));
  }, [initialValues]);

  useEffect(() => {
    if (!initialMaskedSecrets) {
      return;
    }

    setMaskedSecrets({
      chatApiKey: initialMaskedSecrets.chatApiKey ?? null,
      embeddingApiKey: initialMaskedSecrets.embeddingApiKey ?? null
    });
  }, [initialMaskedSecrets]);

  function handleValueChange(
    field: keyof SettingsFormValues,
    nextValue: string | number
  ) {
    setValues((current) => ({
      ...current,
      [field]: nextValue
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined
    }));
    setFormError("");
    setSaveMessage("");
  }

  function validateForm(nextValues: SettingsFormValues) {
    const nextErrors: FieldErrors = {};

    if (!nextValues.chatProvider) {
      nextErrors.chatProvider = "Select a chat provider.";
    }

    if (!nextValues.chatModel.trim()) {
      nextErrors.chatModel = "Enter a chat model.";
    }

    if (!nextValues.embeddingProvider) {
      nextErrors.embeddingProvider = "Select an embedding provider.";
    }

    if (!nextValues.embeddingDimensions || nextValues.embeddingDimensions <= 0) {
      nextErrors.embeddingDimensions = "Enter an embedding dimension.";
    }

    if (!nextValues.embeddingModel.trim()) {
      nextErrors.embeddingModel = "Enter an embedding model.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Fix the highlighted settings before saving.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const result = await onSubmit?.(values);
      const chatApiKeyMasked =
        result?.chatApiKeyMasked ??
        (values.chatApiKey ? "************" : maskedSecrets.chatApiKey);
      const embeddingApiKeyMasked =
        result?.embeddingApiKeyMasked ??
        (values.embeddingApiKey ? "************" : maskedSecrets.embeddingApiKey);

      setMaskedSecrets({
        chatApiKey: chatApiKeyMasked,
        embeddingApiKey: embeddingApiKeyMasked
      });
      setValues((current) => ({
        ...current,
        chatApiKey: "",
        embeddingApiKey: ""
      }));
      setSaveMessage(
        result?.message ?? "Settings saved. Stored secrets remain masked."
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save your settings right now."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <SettingsCard
        description="Choose the provider and model ID used for conversations and reasoning across the workspace."
        iconTone="violet"
        statusLabel="Active"
        title="Chat model"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ProviderSelect
            error={fieldErrors.chatProvider}
            label="Chat provider"
            onChange={(event) => handleValueChange("chatProvider", event.target.value)}
            value={values.chatProvider}
          />
          <Input
            error={fieldErrors.chatModel}
            label="Chat model"
            onChange={(event) => handleValueChange("chatModel", event.target.value)}
            placeholder="gpt-4.1-mini"
            value={values.chatModel}
          />
          <SecretInput
            className="xl:col-span-2"
            label="Chat API key"
            maskedValue={maskedSecrets.chatApiKey}
            onChange={(event) => handleValueChange("chatApiKey", event.target.value)}
            placeholder="Enter a new chat provider key"
            value={values.chatApiKey}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        description="Select the embedding provider and dimension that should match the Pinecone index configured on the server."
        iconTone="aqua"
        statusLabel="Active"
        title="Embedding model"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
          <ProviderSelect
            error={fieldErrors.embeddingProvider}
            label="Embedding provider"
            onChange={(event) =>
              handleValueChange("embeddingProvider", event.target.value)
            }
            value={values.embeddingProvider}
          />
          <Input
            error={fieldErrors.embeddingModel}
            label="Embedding model"
            onChange={(event) =>
              handleValueChange("embeddingModel", event.target.value)
            }
            placeholder="text-embedding-3-small"
            value={values.embeddingModel}
          />
          <Input
            error={fieldErrors.embeddingDimensions}
            hint="This must match the Pinecone index dimension configured on the server."
            label="Embedding dimensions"
            onChange={(event) =>
              handleValueChange(
                "embeddingDimensions",
                Number.parseInt(event.target.value, 10) || 0
              )
            }
            placeholder="1024"
            type="number"
            value={String(values.embeddingDimensions)}
          />
          <SecretInput
            className="xl:col-span-2"
            label="Embedding API key"
            maskedValue={maskedSecrets.embeddingApiKey}
            onChange={(event) =>
              handleValueChange("embeddingApiKey", event.target.value)
            }
            placeholder="Enter a new embedding provider key"
            value={values.embeddingApiKey}
          />
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 xl:row-span-2">
            <p className="text-sm font-medium text-ice-white">About dimensions</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The embedding dimension must match the Pinecone index dimension
              configured on the server before vectors are upserted.
            </p>
          </div>
        </div>
      </SettingsCard>
      {formError ? (
        <ErrorAlert
          message={formError}
          title="Unable to save settings"
        />
      ) : null}
      <SaveBar isSaving={isSaving} message={saveMessage} />
    </form>
  );
}

function SettingsCard({
  children,
  description,
  iconTone,
  statusLabel,
  title
}: {
  children: ReactNode;
  description: string;
  iconTone: "aqua" | "violet";
  statusLabel: string;
  title: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,17,31,0.96),rgba(6,10,22,0.92))] p-5 shadow-glow sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={
              iconTone === "violet"
                ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/20 text-violet"
                : "flex h-12 w-12 items-center justify-center rounded-2xl bg-aqua/15 text-aqua"
            }
          >
            <div className="h-3 w-3 rounded-full bg-current" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold text-ice-white">{title}</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
          </div>
        </div>
        <Badge tone="success">{statusLabel}</Badge>
      </div>
      {children}
    </section>
  );
}
