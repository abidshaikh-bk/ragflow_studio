"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
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
    nextValue: string
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
      <Card
        eyebrow="Settings"
        title="Model configuration status"
        description="Choose the providers and model IDs your workspace should use. Saved secrets stay masked and server-side."
      >
        <div className="grid gap-5 lg:grid-cols-2">
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
            label="Chat API key"
            maskedValue={maskedSecrets.chatApiKey}
            onChange={(event) => handleValueChange("chatApiKey", event.target.value)}
            placeholder="Enter a new chat provider key"
            value={values.chatApiKey}
          />
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
          <SecretInput
            label="Embedding API key"
            maskedValue={maskedSecrets.embeddingApiKey}
            onChange={(event) =>
              handleValueChange("embeddingApiKey", event.target.value)
            }
            placeholder="Enter a new embedding provider key"
            value={values.embeddingApiKey}
          />
        </div>
      </Card>
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
