# DATABASE_SCHEMA.md — Supabase Schema Source of Truth

This schema expands the original MVP schema with secure per-user model credentials, model switching, thinking levels, and multiple chat sessions.

## 1. Enum-like values

Use Postgres enums or constrained text fields.

```sql
create type model_provider as enum ('openai', 'anthropic', 'gemini', 'huggingface', 'server_default');
create type model_kind as enum ('chat', 'embedding');
create type thinking_level as enum ('low', 'medium', 'high');
create type document_status as enum ('uploaded', 'parsing', 'chunking', 'embedding', 'indexing', 'completed', 'failed');
create type chat_role as enum ('user', 'assistant', 'system', 'tool');
```

## 2. Profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

## 3. Provider credentials

Stores encrypted user API keys. The raw key must never be persisted.

```sql
create table public.user_provider_credentials (
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
```

Rules:

- `api_key_hash` is for fingerprinting/deduplication only.
- `api_key_ciphertext` is decrypted only server-side at request time.
- Browser APIs return `id`, `provider`, `label`, `api_key_last4`, `is_active`, timestamps only.

## 4. User model configs

Stores named chat and embedding model configurations.

```sql
create table public.user_model_configs (
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
```

Rules:

- A user can have multiple chat configs.
- A user can have multiple embedding configs.
- Only one default chat config and one default embedding config should be active per user. Enforce in application logic or partial unique indexes.
- Add ownership-preserving composite foreign keys anywhere a user-owned record references another user-owned record.

## 5. User model preferences

```sql
create table public.user_model_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_chat_model_config_id uuid references public.user_model_configs(id) on delete set null,
  default_embedding_model_config_id uuid references public.user_model_configs(id) on delete set null,
  default_thinking_level thinking_level default 'medium' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

## 6. Documents and chunks

```sql
create table public.documents (
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

create table public.document_chunks (
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
```

## 7. Multiple chat sessions

```sql
create table public.chat_sessions (
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

create index chat_sessions_user_updated_idx on public.chat_sessions(user_id, updated_at desc);
```

## 8. Chat messages

```sql
create table public.chat_messages (
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

create index chat_messages_session_created_idx on public.chat_messages(session_id, created_at asc);
```

## 9. Agent tool calls

```sql
create table public.agent_tool_calls (
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
```

## 10. Runtime MCP server configs

```sql
create table public.mcp_server_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  transport text not null check (transport in ('stdio', 'http')),
  command text,
  args jsonb default '[]'::jsonb not null,
  url text,
  env_encrypted jsonb default '{}'::jsonb not null,
  headers_encrypted jsonb default '{}'::jsonb not null,
  secret_fingerprint text,
  allowed_tools jsonb default '[]'::jsonb not null,
  enabled boolean default false not null,
  is_default boolean default false not null,
  timeout_ms int default 30000 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

Rules:

- `transport` supports only `stdio` or `http`.
- `command` is required for `stdio`; `url` is required for `http`.
- `env_encrypted` and `headers_encrypted` must remain encrypted-at-rest server-side only.
- Browser-safe responses must expose only derived booleans such as whether secrets are present, never the stored encrypted values.

## 11. Runtime MCP tool invocations

```sql
create table public.mcp_tool_invocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.chat_sessions(id) on delete set null,
  server_config_id uuid references public.mcp_server_configs(id) on delete set null,
  tool_name text not null,
  tool_input_redacted jsonb default '{}'::jsonb not null,
  tool_output_preview jsonb default '{}'::jsonb not null,
  status text not null,
  latency_ms int,
  error_message text,
  langsmith_run_id text,
  created_at timestamptz default now() not null
);
```

Rules:

- Inputs must be redacted before insert.
- Outputs must be stored as previews, not full unbounded payloads.
- Invocation logs remain user-scoped through `user_id` and session ownership checks.

## 12. RLS policies

Enable RLS on all tables and enforce user ownership.

```sql
alter table public.profiles enable row level security;
alter table public.user_provider_credentials enable row level security;
alter table public.user_model_configs enable row level security;
alter table public.user_model_preferences enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.agent_tool_calls enable row level security;
alter table public.mcp_server_configs enable row level security;
alter table public.mcp_tool_invocations enable row level security;
```

Use this pattern for `user_id` tables:

```sql
create policy "Users can read own rows" on TABLE_NAME
for select using (auth.uid() = user_id);

create policy "Users can insert own rows" on TABLE_NAME
for insert with check (auth.uid() = user_id);

create policy "Users can update own rows" on TABLE_NAME
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own rows" on TABLE_NAME
for delete using (auth.uid() = user_id);
```

For `profiles`, use `auth.uid() = id`.

## 10A. Ownership integrity

RLS alone is not enough for child tables that reference other user-owned rows. Add composite unique keys plus composite foreign keys so a user-owned child record cannot reference another user's parent row.

Examples:

```sql
alter table public.documents
  add constraint documents_id_user_id_unique unique (id, user_id);

alter table public.document_chunks
  add constraint document_chunks_document_owner_fk
  foreign key (document_id, user_id)
  references public.documents(id, user_id)
  on delete cascade;

alter table public.chat_messages
  add constraint chat_messages_session_owner_fk
  foreign key (session_id, user_id)
  references public.chat_sessions(id, user_id)
  on delete cascade;
```

## 10B. Timestamp and profile triggers

Keep `updated_at` fresh with a shared trigger function and create a profile row automatically when a new `auth.users` record is inserted.

## 11. Required migration validation

- Create two test users.
- Add credentials/configs/sessions for both users.
- Verify each user can see only their own rows.
- Verify service role can process documents without exposing service role to frontend.
- Verify no plaintext API key exists in any table.

# Runtime MCP schema extension

These tables land in Phase 10 and should not block the default MVP path when runtime MCP remains disabled.

## `mcp_server_configs`

Stores configurable runtime MCP servers for the product's Agentic RAG assistant.

```sql
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
```

RLS:

- Users may read/write only their own user-scoped configs.
- Admin/global configs require a service/admin path.
- Browser APIs must never return encrypted env/header payloads.

## `mcp_tool_invocations`

```sql
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
```

RLS:

- Users may read only their own invocation logs.
- Inserts happen through server-side authenticated route handlers.

## MVP schema note

The MVP can launch without these MCP-backed features enabled. The schema may exist before the UI and APIs are turned on.
