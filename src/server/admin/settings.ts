import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssistantRuntimeSettingsPayload,
  AssistantToolPolicy
} from "@/lib/validations/admin";
import { createAdminSupabaseClient } from "@/server/supabase/admin";

type AgentRuntimeSettingsRow = {
  created_at: string;
  enable_date_time: boolean;
  enable_vector_search: boolean;
  enable_web_search: boolean;
  singleton_key: string;
  system_prompt: string;
  updated_at: string;
  updated_by: string | null;
};

export type SharedAssistantSettings = {
  systemPrompt: string;
  toolPolicy: AssistantToolPolicy;
  updatedAt: string | null;
};

const AGENT_RUNTIME_SETTINGS_SELECT =
  "singleton_key, system_prompt, enable_vector_search, enable_date_time, enable_web_search, created_at, updated_at, updated_by";

export const DEFAULT_ASSISTANT_TOOL_POLICY: AssistantToolPolicy = {
  enableDateTime: true,
  enableVectorSearch: true,
  enableWebSearch: true
};

export const DEFAULT_SHARED_ASSISTANT_SETTINGS: SharedAssistantSettings = {
  systemPrompt: "",
  toolPolicy: DEFAULT_ASSISTANT_TOOL_POLICY,
  updatedAt: null
};

export async function getSharedAssistantSettings(supabase: SupabaseClient) {
  const result = await supabase
    .from("agent_runtime_settings")
    .select(AGENT_RUNTIME_SETTINGS_SELECT)
    .eq("singleton_key", "global")
    .maybeSingle();

  assertSupabaseSuccess(result.error, "Unable to load the shared assistant settings.");

  if (!result.data) {
    return DEFAULT_SHARED_ASSISTANT_SETTINGS;
  }

  return mapRowToSettings(result.data as AgentRuntimeSettingsRow);
}

export async function saveSharedAssistantSettings(
  supabase: SupabaseClient,
  updatedBy: string,
  payload: AssistantRuntimeSettingsPayload
) {
  const result = await supabase
    .from("agent_runtime_settings")
    .upsert({
      enable_date_time: payload.toolPolicy.enableDateTime,
      enable_vector_search: payload.toolPolicy.enableVectorSearch,
      enable_web_search: payload.toolPolicy.enableWebSearch,
      singleton_key: "global",
      system_prompt: payload.systemPrompt.trim(),
      updated_by: updatedBy
    })
    .select(AGENT_RUNTIME_SETTINGS_SELECT)
    .single();

  assertSupabaseSuccess(result.error, "Unable to save the shared assistant settings.");

  return mapRowToSettings(result.data as AgentRuntimeSettingsRow);
}

export async function loadRuntimeAssistantSettings() {
  const supabase = createAdminSupabaseClient();

  return getSharedAssistantSettings(supabase);
}

function mapRowToSettings(row: AgentRuntimeSettingsRow): SharedAssistantSettings {
  return {
    systemPrompt: row.system_prompt ?? "",
    toolPolicy: {
      enableDateTime: row.enable_date_time,
      enableVectorSearch: row.enable_vector_search,
      enableWebSearch: row.enable_web_search
    },
    updatedAt: row.updated_at ?? null
  };
}

function assertSupabaseSuccess(error: { message?: string } | null, fallback: string) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
