-- RAGFlow Studio core schema for Codex agents.
-- Keep this migration aligned with DATABASE_SCHEMA.md.

create extension if not exists pgcrypto;

do $$ begin
  create type model_provider as enum ('openai', 'anthropic', 'gemini', 'huggingface', 'server_default');
exception when duplicate_object then null; end $$;

do $$ begin
  create type model_kind as enum ('chat', 'embedding');
exception when duplicate_object then null; end $$;

do $$ begin
  create type thinking_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_status as enum ('uploaded', 'parsing', 'chunking', 'embedding', 'indexing', 'completed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant', 'system', 'tool');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.user_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider model_provider not null,
  label text not null,
  api_key_ciphertext text,
  api_key_iv text,
  api_key_tag text,
  api_key_hash text,
  api_key_last4 text,
  encryption_key_version text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, provider, label)
);

create table if not exists public.user_model_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id uuid references public.user_provider_credentials(id) on delete set null,
  provider model_provider not null,
  kind model_kind not null,
  display_name text not null,
  model_name text not null,
  is_default boolean default false not null,
  supports_thinking boolean default false not null,
  default_thinking_level thinking_level default 'medium' not null,
  temperature numeric default 0.2,
  max_output_tokens integer,
  extra_config jsonb default '{}'::jsonb not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.user_model_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_chat_model_config_id uuid references public.user_model_configs(id) on delete set null,
  default_embedding_model_config_id uuid references public.user_model_configs(id) on delete set null,
  default_thinking_level thinking_level default 'medium' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  s3_key text not null,
  status document_status default 'uploaded' not null,
  error_message text,
  total_chunks int default 0 not null,
  processed_chunks int default 0 not null,
  pinecone_namespace text not null,
  embedding_model_config_id uuid references public.user_model_configs(id) on delete set null,
  embedding_model_snapshot jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index int not null,
  content_preview text,
  token_count int,
  pinecone_vector_id text not null,
  created_at timestamptz default now() not null,
  unique (document_id, chunk_index)
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New chat' not null,
  model_config_id uuid references public.user_model_configs(id) on delete set null,
  thinking_level thinking_level default 'medium' not null,
  system_prompt text,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role chat_role not null,
  content text not null,
  metadata jsonb default '{}'::jsonb not null,
  model_config_id uuid references public.user_model_configs(id) on delete set null,
  model_snapshot jsonb default '{}'::jsonb not null,
  thinking_level thinking_level,
  langsmith_run_id text,
  created_at timestamptz default now() not null
);

create table if not exists public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  tool_input jsonb default '{}'::jsonb not null,
  tool_output jsonb default '{}'::jsonb not null,
  status text not null,
  latency_ms int,
  langsmith_run_id text,
  created_at timestamptz default now() not null
);

create index if not exists chat_sessions_user_updated_idx on public.chat_sessions(user_id, updated_at desc);
create index if not exists chat_messages_session_created_idx on public.chat_messages(session_id, created_at asc);

alter table public.profiles enable row level security;
alter table public.user_provider_credentials enable row level security;
alter table public.user_model_configs enable row level security;
alter table public.user_model_preferences enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.agent_tool_calls enable row level security;

-- Agents must add explicit policies in the implementation task and validate cross-user isolation.

-- Optional Phase 4 runtime MCP tables. These do not need to be used by the MVP UI/API.
create table if not exists public.mcp_server_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  transport text not null check (transport in ('stdio', 'http')),
  command text,
  args jsonb not null default '[]'::jsonb,
  url text,
  env_encrypted jsonb,
  headers_encrypted jsonb,
  secret_fingerprint text,
  allowed_tools jsonb not null default '[]'::jsonb,
  enabled boolean not null default false,
  is_default boolean not null default false,
  timeout_ms int not null default 30000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mcp_stdio_requires_command check (transport <> 'stdio' or command is not null),
  constraint mcp_http_requires_url check (transport <> 'http' or url is not null)
);

create table if not exists public.mcp_tool_invocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  server_config_id uuid references public.mcp_server_configs(id) on delete set null,
  tool_name text not null,
  tool_input_redacted jsonb,
  tool_output_preview jsonb,
  status text not null,
  latency_ms int,
  error_message text,
  langsmith_run_id text,
  created_at timestamptz not null default now()
);

alter table public.mcp_server_configs enable row level security;
alter table public.mcp_tool_invocations enable row level security;

create policy "Users can read own MCP configs"
  on public.mcp_server_configs for select
  using (auth.uid() = user_id);

create policy "Users can insert own MCP configs"
  on public.mcp_server_configs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own MCP configs"
  on public.mcp_server_configs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own MCP configs"
  on public.mcp_server_configs for delete
  using (auth.uid() = user_id);

create policy "Users can read own MCP invocation logs"
  on public.mcp_tool_invocations for select
  using (auth.uid() = user_id);
