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

do $$ begin
  alter table public.user_provider_credentials
    add constraint user_provider_credentials_id_user_id_unique unique (id, user_id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  alter table public.user_model_configs
    add constraint user_model_configs_id_user_id_unique unique (id, user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.user_model_configs
    add constraint user_model_configs_credential_owner_fk
    foreign key (credential_id, user_id)
    references public.user_provider_credentials(id, user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.user_model_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_chat_model_config_id uuid references public.user_model_configs(id) on delete set null,
  default_embedding_model_config_id uuid references public.user_model_configs(id) on delete set null,
  default_thinking_level thinking_level default 'medium' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

do $$ begin
  alter table public.user_model_preferences
    add constraint user_model_preferences_default_chat_fk
    foreign key (default_chat_model_config_id, user_id)
    references public.user_model_configs(id, user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.user_model_preferences
    add constraint user_model_preferences_default_embedding_fk
    foreign key (default_embedding_model_config_id, user_id)
    references public.user_model_configs(id, user_id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  alter table public.documents
    add constraint documents_id_user_id_unique unique (id, user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.documents
    add constraint documents_embedding_model_owner_fk
    foreign key (embedding_model_config_id, user_id)
    references public.user_model_configs(id, user_id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  alter table public.document_chunks
    add constraint document_chunks_document_owner_fk
    foreign key (document_id, user_id)
    references public.documents(id, user_id)
    on delete cascade;
exception when duplicate_object then null; end $$;

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

do $$ begin
  alter table public.chat_sessions
    add constraint chat_sessions_id_user_id_unique unique (id, user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.chat_sessions
    add constraint chat_sessions_model_config_owner_fk
    foreign key (model_config_id, user_id)
    references public.user_model_configs(id, user_id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  alter table public.chat_messages
    add constraint chat_messages_id_user_id_unique unique (id, user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.chat_messages
    add constraint chat_messages_session_owner_fk
    foreign key (session_id, user_id)
    references public.chat_sessions(id, user_id)
    on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.chat_messages
    add constraint chat_messages_model_config_owner_fk
    foreign key (model_config_id, user_id)
    references public.user_model_configs(id, user_id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  alter table public.agent_tool_calls
    add constraint agent_tool_calls_session_owner_fk
    foreign key (session_id, user_id)
    references public.chat_sessions(id, user_id)
    on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.agent_tool_calls
    add constraint agent_tool_calls_message_owner_fk
    foreign key (message_id, user_id)
    references public.chat_messages(id, user_id);
exception when duplicate_object then null; end $$;

create index if not exists chat_sessions_user_updated_idx on public.chat_sessions(user_id, updated_at desc);
create index if not exists chat_messages_session_created_idx on public.chat_messages(session_id, created_at asc);
create index if not exists documents_user_created_idx on public.documents(user_id, created_at desc);
create index if not exists documents_user_status_idx on public.documents(user_id, status);
create index if not exists document_chunks_document_idx on public.document_chunks(document_id, chunk_index);
create index if not exists agent_tool_calls_session_created_idx on public.agent_tool_calls(session_id, created_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_provider_credentials_updated_at on public.user_provider_credentials;
create trigger set_user_provider_credentials_updated_at
before update on public.user_provider_credentials
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_model_configs_updated_at on public.user_model_configs;
create trigger set_user_model_configs_updated_at
before update on public.user_model_configs
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_model_preferences_updated_at on public.user_model_preferences;
create trigger set_user_model_preferences_updated_at
before update on public.user_model_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

drop trigger if exists set_chat_sessions_updated_at on public.chat_sessions;
create trigger set_chat_sessions_updated_at
before update on public.chat_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.user_provider_credentials enable row level security;
alter table public.user_model_configs enable row level security;
alter table public.user_model_preferences enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.agent_tool_calls enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

drop policy if exists "Users can read own provider credentials" on public.user_provider_credentials;
create policy "Users can read own provider credentials"
  on public.user_provider_credentials for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own provider credentials" on public.user_provider_credentials;
create policy "Users can insert own provider credentials"
  on public.user_provider_credentials for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own provider credentials" on public.user_provider_credentials;
create policy "Users can update own provider credentials"
  on public.user_provider_credentials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own provider credentials" on public.user_provider_credentials;
create policy "Users can delete own provider credentials"
  on public.user_provider_credentials for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own model configs" on public.user_model_configs;
create policy "Users can read own model configs"
  on public.user_model_configs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own model configs" on public.user_model_configs;
create policy "Users can insert own model configs"
  on public.user_model_configs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own model configs" on public.user_model_configs;
create policy "Users can update own model configs"
  on public.user_model_configs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own model configs" on public.user_model_configs;
create policy "Users can delete own model configs"
  on public.user_model_configs for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own model preferences" on public.user_model_preferences;
create policy "Users can read own model preferences"
  on public.user_model_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own model preferences" on public.user_model_preferences;
create policy "Users can insert own model preferences"
  on public.user_model_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own model preferences" on public.user_model_preferences;
create policy "Users can update own model preferences"
  on public.user_model_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own model preferences" on public.user_model_preferences;
create policy "Users can delete own model preferences"
  on public.user_model_preferences for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own documents" on public.documents;
create policy "Users can read own documents"
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own document chunks" on public.document_chunks;
create policy "Users can read own document chunks"
  on public.document_chunks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own document chunks" on public.document_chunks;
create policy "Users can insert own document chunks"
  on public.document_chunks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own document chunks" on public.document_chunks;
create policy "Users can update own document chunks"
  on public.document_chunks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own document chunks" on public.document_chunks;
create policy "Users can delete own document chunks"
  on public.document_chunks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own chat sessions" on public.chat_sessions;
create policy "Users can read own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat sessions" on public.chat_sessions;
create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;
create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own chat messages" on public.chat_messages;
create policy "Users can read own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat messages" on public.chat_messages;
create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own chat messages" on public.chat_messages;
create policy "Users can update own chat messages"
  on public.chat_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat messages" on public.chat_messages;
create policy "Users can delete own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own agent tool calls" on public.agent_tool_calls;
create policy "Users can read own agent tool calls"
  on public.agent_tool_calls for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own agent tool calls" on public.agent_tool_calls;
create policy "Users can insert own agent tool calls"
  on public.agent_tool_calls for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own agent tool calls" on public.agent_tool_calls;
create policy "Users can update own agent tool calls"
  on public.agent_tool_calls for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own agent tool calls" on public.agent_tool_calls;
create policy "Users can delete own agent tool calls"
  on public.agent_tool_calls for delete
  using (auth.uid() = user_id);

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

grant select, insert, update, delete on public.mcp_server_configs to authenticated, service_role;
grant select, insert, update, delete on public.mcp_tool_invocations to authenticated, service_role;

drop trigger if exists set_mcp_server_configs_updated_at on public.mcp_server_configs;
create trigger set_mcp_server_configs_updated_at
before update on public.mcp_server_configs
for each row
execute function public.set_updated_at();

drop policy if exists "Users can read own MCP configs" on public.mcp_server_configs;
create policy "Users can read own MCP configs"
  on public.mcp_server_configs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own MCP configs" on public.mcp_server_configs;
create policy "Users can insert own MCP configs"
  on public.mcp_server_configs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own MCP configs" on public.mcp_server_configs;
create policy "Users can update own MCP configs"
  on public.mcp_server_configs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own MCP configs" on public.mcp_server_configs;
create policy "Users can delete own MCP configs"
  on public.mcp_server_configs for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own MCP invocation logs" on public.mcp_tool_invocations;
create policy "Users can read own MCP invocation logs"
  on public.mcp_tool_invocations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own MCP invocation logs" on public.mcp_tool_invocations;
create policy "Users can insert own MCP invocation logs"
  on public.mcp_tool_invocations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own MCP invocation logs" on public.mcp_tool_invocations;
create policy "Users can update own MCP invocation logs"
  on public.mcp_tool_invocations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own MCP invocation logs" on public.mcp_tool_invocations;
create policy "Users can delete own MCP invocation logs"
  on public.mcp_tool_invocations for delete
  using (auth.uid() = user_id);
