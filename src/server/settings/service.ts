import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPineconeDimensionEnv } from "@/lib/env";
import type { SettingsPayload } from "@/lib/validations/settings";
import { decryptSecret, encryptSecret } from "@/server/settings/crypto";

const DEFAULT_SETTINGS = {
  chatModel: "gpt-4.1-mini",
  chatProvider: "openai",
  embeddingDimensions: 1024,
  embeddingModel: "text-embedding-3-small",
  embeddingProvider: "openai"
} as const;

const SETTINGS_LABELS = {
  chat: "default-chat",
  embedding: "default-embedding"
} as const;

type SettingsKind = keyof typeof SETTINGS_LABELS;

type ModelConfigRow = {
  extra_config?: {
    dimensions?: number;
  } | null;
  id: string;
  kind: "chat" | "embedding";
  model_name: string;
  provider: string;
};

type CredentialRow = {
  api_key_ciphertext?: string | null;
  api_key_last4: string | null;
  api_key_tag?: string | null;
  api_key_iv?: string | null;
  encryption_key_version?: string | null;
  id: string;
  is_active: boolean;
  label: string;
  provider: string;
};

export type UserSettings = {
  chatApiKeyMasked: string | null;
  chatModel: string;
  chatProvider: string;
  embeddingApiKeyMasked: string | null;
  embeddingDimensions: number;
  embeddingModel: string;
  embeddingProvider: string;
};

export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSettings> {
  const [configsResult, credentialsResult] = await Promise.all([
    supabase
      .from("user_model_configs")
      .select("id, kind, model_name, provider, extra_config")
      .eq("user_id", userId)
      .eq("is_default", true)
      .eq("is_active", true),
    supabase
      .from("user_provider_credentials")
      .select(
        "id, provider, label, api_key_ciphertext, api_key_iv, api_key_tag, api_key_last4, is_active"
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("label", [SETTINGS_LABELS.chat, SETTINGS_LABELS.embedding])
  ]);

  assertSupabaseSuccess(configsResult.error, "Unable to load saved model settings.");
  assertSupabaseSuccess(
    credentialsResult.error,
    "Unable to load saved provider credentials."
  );

  const chatConfig = (configsResult.data as ModelConfigRow[] | null)?.find(
    (config) => config.kind === "chat"
  );
  const embeddingConfig = (configsResult.data as ModelConfigRow[] | null)?.find(
    (config) => config.kind === "embedding"
  );
  const chatCredential = (credentialsResult.data as CredentialRow[] | null)?.find(
    (credential) => credential.label === SETTINGS_LABELS.chat
  );
  const embeddingCredential = (
    credentialsResult.data as CredentialRow[] | null
  )?.find((credential) => credential.label === SETTINGS_LABELS.embedding);

  return {
    chatApiKeyMasked: hasDecryptableSecret(chatCredential)
      ? formatMaskedSecret(chatCredential?.api_key_last4 ?? null)
      : null,
    chatModel: chatConfig?.model_name ?? DEFAULT_SETTINGS.chatModel,
    chatProvider: chatConfig?.provider ?? DEFAULT_SETTINGS.chatProvider,
    embeddingApiKeyMasked: hasDecryptableSecret(embeddingCredential)
      ? formatMaskedSecret(embeddingCredential?.api_key_last4 ?? null)
      : null,
    embeddingDimensions:
      embeddingConfig?.extra_config?.dimensions ?? getDefaultEmbeddingDimensions(),
    embeddingModel: embeddingConfig?.model_name ?? DEFAULT_SETTINGS.embeddingModel,
    embeddingProvider:
      embeddingConfig?.provider ?? DEFAULT_SETTINGS.embeddingProvider
  };
}

export async function saveUserSettings(
  supabase: SupabaseClient,
  userId: string,
  payload: SettingsPayload
): Promise<UserSettings> {
  const chatConfigId = await saveModelConfig(supabase, userId, "chat", {
    model: payload.chatModel,
    provider: payload.chatProvider
  });
  const embeddingConfigId = await saveModelConfig(supabase, userId, "embedding", {
    dimensions: payload.embeddingDimensions,
    model: payload.embeddingModel,
    provider: payload.embeddingProvider
  });

  await Promise.all([
    syncCredentialMetadata(supabase, userId, "chat", payload.chatProvider, payload.chatApiKey),
    syncCredentialMetadata(
      supabase,
      userId,
      "embedding",
      payload.embeddingProvider,
      payload.embeddingApiKey
    ),
    saveModelPreferences(supabase, userId, {
      chatConfigId,
      embeddingConfigId
    })
  ]);

  return getUserSettings(supabase, userId);
}

async function saveModelConfig(
  supabase: SupabaseClient,
  userId: string,
  kind: ModelConfigRow["kind"],
  values: {
    dimensions?: number;
    model: string;
    provider: string;
  }
) {
  if (kind === "embedding") {
    assertMatchingPineconeDimension(values.dimensions);
  }

  const existingResult = await supabase
    .from("user_model_configs")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("is_default", true)
    .maybeSingle();

  assertSupabaseSuccess(
    existingResult.error,
    `Unable to inspect the saved ${kind} model configuration.`
  );

  if (existingResult.data?.id) {
    const updateResult = await supabase
      .from("user_model_configs")
      .update({
        display_name: kind === "chat" ? "Default chat model" : "Default embedding model",
        extra_config:
          kind === "embedding"
            ? {
                dimensions: values.dimensions ?? getDefaultEmbeddingDimensions()
              }
            : {},
        is_active: true,
        is_default: true,
        model_name: values.model,
        provider: values.provider
      })
      .eq("id", existingResult.data.id)
      .eq("user_id", userId)
      .select("id")
      .single();

    assertSupabaseSuccess(
      updateResult.error,
      `Unable to update the ${kind} model configuration.`
    );

    if (!updateResult.data?.id) {
      throw new Error(`The updated ${kind} model configuration did not return an id.`);
    }

    return updateResult.data.id as string;
  }

  const insertResult = await supabase
    .from("user_model_configs")
    .insert({
      display_name: kind === "chat" ? "Default chat model" : "Default embedding model",
      extra_config:
        kind === "embedding"
          ? {
              dimensions: values.dimensions ?? getDefaultEmbeddingDimensions()
            }
          : {},
      is_active: true,
      is_default: true,
      kind,
      model_name: values.model,
      provider: values.provider,
      user_id: userId
    })
    .select("id")
    .single();

  assertSupabaseSuccess(
    insertResult.error,
    `Unable to create the ${kind} model configuration.`
  );

  if (!insertResult.data?.id) {
    throw new Error(`The created ${kind} model configuration did not return an id.`);
  }

  return insertResult.data.id as string;
}

async function saveModelPreferences(
  supabase: SupabaseClient,
  userId: string,
  ids: {
    chatConfigId: string;
    embeddingConfigId: string;
  }
) {
  const result = await supabase.from("user_model_preferences").upsert(
    {
      default_chat_model_config_id: ids.chatConfigId,
      default_embedding_model_config_id: ids.embeddingConfigId,
      user_id: userId
    },
    {
      onConflict: "user_id"
    }
  );

  assertSupabaseSuccess(result.error, "Unable to save the default model preferences.");
}

async function syncCredentialMetadata(
  supabase: SupabaseClient,
  userId: string,
  kind: SettingsKind,
  provider: string,
  secret: string
) {
  const label = SETTINGS_LABELS[kind];
  const nextSecret = secret.trim();

  const existingResult = await supabase
    .from("user_provider_credentials")
    .select(
      "id, provider, label, api_key_ciphertext, api_key_iv, api_key_tag, api_key_last4, is_active"
    )
    .eq("user_id", userId)
    .eq("label", label)
    .eq("is_active", true)
    .maybeSingle();

  assertSupabaseSuccess(
    existingResult.error,
    `Unable to inspect the saved ${kind} provider credentials.`
  );

  const existingCredential = existingResult.data as CredentialRow | null;

  if (!nextSecret) {
    if (existingCredential && existingCredential.provider !== provider) {
      const clearResult = await supabase
        .from("user_provider_credentials")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("label", label)
        .eq("is_active", true);

      assertSupabaseSuccess(
        clearResult.error,
        `Unable to clear stale ${kind} provider credentials.`
      );
    }

    if (
      existingCredential &&
      existingCredential.provider === provider &&
      existingCredential.api_key_last4 &&
      !hasDecryptableSecret(existingCredential)
    ) {
      throw new Error(
        `Your saved ${kind} ${provider} API key must be re-entered in Settings before it can be used.`
      );
    }

    return;
  }

  const deactivateResult = await supabase
    .from("user_provider_credentials")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("label", label)
    .eq("is_active", true);

  assertSupabaseSuccess(
    deactivateResult.error,
    `Unable to replace the existing ${kind} provider credentials.`
  );

  const upsertResult = await supabase.from("user_provider_credentials").upsert(
    {
      ...encryptSecret(nextSecret),
      api_key_hash: createHash("sha256").update(nextSecret).digest("hex"),
      api_key_last4: nextSecret.slice(-4),
      is_active: true,
      label,
      provider,
      user_id: userId
    },
    {
      onConflict: "user_id,provider,label"
    }
  );

  assertSupabaseSuccess(
    upsertResult.error,
    `Unable to save the ${kind} provider credentials.`
  );
}

function formatMaskedSecret(last4: string | null) {
  return last4 ? `********${last4}` : null;
}

function hasDecryptableSecret(credential: CredentialRow | undefined) {
  return Boolean(
    credential?.api_key_ciphertext && credential.api_key_iv && credential.api_key_tag
  );
}

function getDefaultEmbeddingDimensions() {
  return getPineconeDimensionEnv() || DEFAULT_SETTINGS.embeddingDimensions;
}

function assertMatchingPineconeDimension(dimensions?: number) {
  const pineconeDimension = getDefaultEmbeddingDimensions();

  if (!dimensions) {
    throw new Error("Embedding dimension is required.");
  }

  if (dimensions !== pineconeDimension) {
    throw new Error(
      `Embedding dimension must match the Pinecone index dimension of ${pineconeDimension}.`
    );
  }
}

export async function getProviderCredentialSecret(
  supabase: SupabaseClient,
  input: {
    label: string;
    provider: string;
    userId: string;
  }
): Promise<string | null> {
  const result = await supabase
    .from("user_provider_credentials")
    .select(
      "id, provider, label, api_key_ciphertext, api_key_iv, api_key_tag, encryption_key_version, is_active"
    )
    .eq("user_id", input.userId)
    .eq("label", input.label)
    .eq("provider", input.provider)
    .eq("is_active", true)
    .maybeSingle();

  assertSupabaseSuccess(
    result.error,
    "Unable to load the saved provider credentials for this user."
  );

  const credential = result.data as CredentialRow | null;

  if (
    !credential?.api_key_ciphertext ||
    !credential.api_key_iv ||
    !credential.api_key_tag
  ) {
    if (credential?.api_key_last4) {
      throw new Error(
        `Your saved ${input.provider} API key must be re-entered in Settings before it can be used.`
      );
    }

    return null;
  }

  return decryptSecret({
    ciphertext: credential.api_key_ciphertext,
    iv: credential.api_key_iv,
    keyVersion: credential.encryption_key_version ?? undefined,
    tag: credential.api_key_tag
  });
}

function assertSupabaseSuccess(error: { message?: string } | null, fallback: string) {
  if (!error) {
    return;
  }

  throw new Error(error.message || fallback);
}
