import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatModelOption, ChatModelSnapshot, ThinkingLevel } from "@/components/chat/types";

type ChatModelConfigRow = {
  default_thinking_level: ThinkingLevel;
  display_name: string;
  id: string;
  is_default: boolean;
  model_name: string;
  provider: string;
  supports_thinking: boolean;
};

type ChatModelPreferenceRow = {
  default_chat_model_config_id: string | null;
  default_thinking_level: ThinkingLevel | null;
};

export type ChatModelPreferences = {
  defaultModelConfigId: string | null;
  defaultThinkingLevel: ThinkingLevel;
  models: ChatModelOption[];
};

export type ResolvedChatSelection = {
  model: ChatModelOption;
  snapshot: ChatModelSnapshot;
  thinkingLevel: ThinkingLevel;
};

export async function listChatModelPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<ChatModelPreferences> {
  const [configsResult, preferencesResult] = await Promise.all([
    supabase
      .from("user_model_configs")
      .select(
        "id, display_name, model_name, provider, supports_thinking, default_thinking_level, is_default"
      )
      .eq("user_id", userId)
      .eq("kind", "chat")
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("user_model_preferences")
      .select("default_chat_model_config_id, default_thinking_level")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  assertSupabaseSuccess(configsResult.error, "Unable to load chat model options.");
  assertSupabaseSuccess(
    preferencesResult.error,
    "Unable to load the saved chat model preferences."
  );

  const models = ((configsResult.data as ChatModelConfigRow[] | null) ?? []).map(
    mapConfigToOption
  );
  const preference = preferencesResult.data as ChatModelPreferenceRow | null;
  const defaultModelConfigId =
    preference?.default_chat_model_config_id ??
    models.find((model) => model.isDefault)?.id ??
    models[0]?.id ??
    null;
  const defaultThinkingLevel =
    preference?.default_thinking_level ??
    models.find((model) => model.id === defaultModelConfigId)?.defaultThinkingLevel ??
    "medium";

  if (models.length === 0) {
    return {
      defaultModelConfigId: null,
      defaultThinkingLevel,
      models: [
        {
          defaultThinkingLevel,
          id: null,
          isDefault: true,
          label: "Server default",
          modelName: process.env.DEFAULT_CHAT_MODEL?.trim() || "gpt-4.1-mini",
          provider: normalizeProvider(process.env.DEFAULT_CHAT_PROVIDER) ?? "openai",
          supportsThinking: true
        }
      ]
    };
  }

  return {
    defaultModelConfigId,
    defaultThinkingLevel,
    models
  };
}

export async function resolveChatModelSelection(
  supabase: SupabaseClient,
  input: {
    modelConfigId?: string | null;
    thinkingLevel?: ThinkingLevel;
    userId: string;
  }
): Promise<ResolvedChatSelection> {
  const preferences = await listChatModelPreferences(supabase, input.userId);
  const selectedModel =
    input.modelConfigId === null
      ? preferences.models.find((model) => model.id === null) ?? preferences.models[0]
      : input.modelConfigId
        ? preferences.models.find((model) => model.id === input.modelConfigId)
        : preferences.models.find((model) => model.id === preferences.defaultModelConfigId) ??
          preferences.models[0];

  if (!selectedModel) {
    throw new Error("No chat model options are available.");
  }

  if (
    input.modelConfigId &&
    input.modelConfigId !== selectedModel.id
  ) {
    throw new Error("Selected chat model not found.");
  }

  const thinkingLevel =
    input.thinkingLevel ??
    selectedModel.defaultThinkingLevel ??
    preferences.defaultThinkingLevel;

  return {
    model: selectedModel,
    snapshot: {
      label: selectedModel.label,
      modelName: selectedModel.modelName,
      provider: selectedModel.provider
    },
    thinkingLevel
  };
}

function mapConfigToOption(config: ChatModelConfigRow): ChatModelOption {
  return {
    defaultThinkingLevel: config.default_thinking_level,
    id: config.id,
    isDefault: config.is_default,
    label: config.display_name,
    modelName: config.model_name,
    provider: config.provider,
    supportsThinking: config.supports_thinking
  };
}

function normalizeProvider(provider?: string) {
  const normalized = provider?.trim().toLowerCase();

  return normalized ? normalized : null;
}

function assertSupabaseSuccess(error: { message?: string } | null, fallback: string) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
