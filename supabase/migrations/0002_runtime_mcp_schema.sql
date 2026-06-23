-- Runtime MCP schema for configurable Agentic RAG tools.

create table if not exists public.mcp_server_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  transport text not null,
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
  updated_at timestamptz default now() not null,
  constraint mcp_server_configs_transport_check
    check (transport in ('stdio', 'http')),
  constraint mcp_server_configs_args_shape_check
    check (jsonb_typeof(args) = 'array'),
  constraint mcp_server_configs_allowed_tools_shape_check
    check (jsonb_typeof(allowed_tools) = 'array'),
  constraint mcp_server_configs_env_shape_check
    check (jsonb_typeof(env_encrypted) = 'object'),
  constraint mcp_server_configs_headers_shape_check
    check (jsonb_typeof(headers_encrypted) = 'object'),
  constraint mcp_server_configs_timeout_check
    check (timeout_ms between 1000 and 120000),
  constraint mcp_server_configs_transport_fields_check
    check (
      (
        transport = 'stdio'
        and command is not null
        and btrim(command) <> ''
        and url is null
      ) or (
        transport = 'http'
        and url is not null
        and btrim(url) <> ''
        and command is null
      )
    )
);

create table if not exists public.mcp_tool_invocations (
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
  created_at timestamptz default now() not null,
  constraint mcp_tool_invocations_session_owner_fk
    foreign key (session_id, user_id)
    references public.chat_sessions(id, user_id)
    on delete cascade
);

create index if not exists mcp_server_configs_user_created_idx
  on public.mcp_server_configs(user_id, created_at desc);

create index if not exists mcp_server_configs_enabled_idx
  on public.mcp_server_configs(user_id, enabled, created_at desc);

create index if not exists mcp_tool_invocations_user_created_idx
  on public.mcp_tool_invocations(user_id, created_at desc);

create index if not exists mcp_tool_invocations_session_created_idx
  on public.mcp_tool_invocations(session_id, created_at asc);

drop trigger if exists set_mcp_server_configs_updated_at on public.mcp_server_configs;
create trigger set_mcp_server_configs_updated_at
before update on public.mcp_server_configs
for each row
execute function public.set_updated_at();

alter table public.mcp_server_configs enable row level security;
alter table public.mcp_tool_invocations enable row level security;

grant select, insert, update, delete on public.mcp_server_configs to authenticated, service_role;
grant select, insert, update, delete on public.mcp_tool_invocations to authenticated, service_role;

drop policy if exists "Users can read own MCP server configs" on public.mcp_server_configs;
create policy "Users can read own MCP server configs"
  on public.mcp_server_configs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own MCP server configs" on public.mcp_server_configs;
create policy "Users can insert own MCP server configs"
  on public.mcp_server_configs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own MCP server configs" on public.mcp_server_configs;
create policy "Users can update own MCP server configs"
  on public.mcp_server_configs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own MCP server configs" on public.mcp_server_configs;
create policy "Users can delete own MCP server configs"
  on public.mcp_server_configs for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own MCP tool invocations" on public.mcp_tool_invocations;
create policy "Users can read own MCP tool invocations"
  on public.mcp_tool_invocations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own MCP tool invocations" on public.mcp_tool_invocations;
create policy "Users can insert own MCP tool invocations"
  on public.mcp_tool_invocations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own MCP tool invocations" on public.mcp_tool_invocations;
create policy "Users can update own MCP tool invocations"
  on public.mcp_tool_invocations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own MCP tool invocations" on public.mcp_tool_invocations;
create policy "Users can delete own MCP tool invocations"
  on public.mcp_tool_invocations for delete
  using (auth.uid() = user_id);
