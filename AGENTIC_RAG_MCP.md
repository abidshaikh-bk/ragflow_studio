# AGENTIC_RAG_MCP.md — Configurable MCP System for Runtime Agentic RAG

## Purpose

This document defines the future configurable MCP layer used by the runtime Agentic RAG assistant. This is different from the development-time MCP servers used by Codex agents in `MCP_SERVERS.md`.

Development-time MCP helps coding agents build the product. Runtime MCP lets the product's AI assistant use configured tools.

## MVP decision

The MVP must use built-in server-side tools first:

1. `vector_search` — query Pinecone for the authenticated user's document chunks.
2. `date_time` — return deterministic current date/time.

Tavily and configurable MCP servers are later-phase enhancements. This keeps the first release focused on document upload and private user-data RAG.

## Supported runtime MCP transports

The runtime MCP layer must eventually support two transports:

### 1. stdio transport

Used for local or containerized MCP servers launched by command.

Configuration fields:

- `transport`: `stdio`
- `command`: executable command, for example `npx`
- `args`: JSON array of args
- `env_encrypted`: encrypted JSON object of environment variables
- `timeout_ms`
- `enabled`

Example:

```json
{
  "name": "local-date-tools",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "some-mcp-server"],
  "timeout_ms": 30000,
  "enabled": true
}
```

### 2. HTTP transport

Used for remote MCP-compatible services.

Configuration fields:

- `transport`: `http`
- `url`: MCP server URL
- `headers_encrypted`: encrypted headers such as authorization tokens
- `timeout_ms`
- `enabled`

Example:

```json
{
  "name": "remote-search-tools",
  "transport": "http",
  "url": "https://mcp.example.com/mcp",
  "headers_encrypted": {
    "Authorization": "Bearer <encrypted>"
  },
  "timeout_ms": 30000,
  "enabled": true
}
```

## Database model

Add this in Phase 10, after the MVP smoke path is stable.

### `mcp_server_configs`

Stores runtime MCP server configurations.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id)` nullable for admin/global configs
- `name text not null`
- `description text`
- `transport text not null check (transport in ('stdio', 'http'))`
- `command text` for stdio
- `args jsonb default '[]'::jsonb` for stdio
- `url text` for HTTP
- `env_encrypted jsonb` for stdio secrets
- `headers_encrypted jsonb` for HTTP secrets
- `secret_fingerprint text` optional audit fingerprint
- `allowed_tools jsonb default '[]'::jsonb`
- `enabled boolean default false`
- `is_default boolean default false`
- `timeout_ms int default 30000`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `mcp_tool_invocations`

Stores runtime MCP tool-call audit logs.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id)`
- `session_id uuid references chat_sessions(id)`
- `server_config_id uuid references mcp_server_configs(id)`
- `tool_name text not null`
- `tool_input_redacted jsonb`
- `tool_output_preview jsonb`
- `status text`
- `latency_ms int`
- `error_message text`
- `langsmith_run_id text`
- `created_at timestamptz default now()`

## Backend architecture

Create a server-only runtime MCP adapter in Phase 10:

```txt
src/server/mcp/
  registry.ts          # loads enabled configs for user/global scope
  client.ts            # creates stdio/http MCP clients
  tools.ts             # converts MCP tools into LangChain/LangGraph tools
  redaction.ts         # redacts secrets from inputs/outputs/logs
  policy.ts            # allowlist/denylist and timeout rules
```

Rules:

1. MCP clients must only run on the server.
2. MCP configs must never be sent raw to the browser.
3. Secrets must be encrypted, not merely hashed.
4. Hash/fingerprint may be stored only for deduplication/audit.
5. Runtime MCP tools must be scoped to the authenticated user.
6. Tool invocations must be logged with redacted inputs and output previews.
7. Each MCP tool call must have a timeout.
8. stdio commands must use an allowlist in production.
9. The backend adapter may expose LangChain-compatible tool wrappers, but the live agent should not load them until the later integration task.

## Frontend UI plan

MCP configuration is not part of MVP Phase 1. Add it in Phase 10 under Settings.

Settings tabs:

- Models
- Embeddings
- Credentials
- MCP Tools

MCP Tools page states:

1. Empty state: “No MCP servers configured.”
2. Add server modal.
3. Transport selector: `stdio` or `http`.
4. stdio fields: name, command, args, env secrets, timeout, enabled.
5. HTTP fields: name, URL, headers/secrets, timeout, enabled.
6. Tool preview panel after connection test.
7. Danger zone for disabling/deleting server.

## API routes for Phase 10

- `GET /api/mcp/servers`
- `POST /api/mcp/servers`
- `GET /api/mcp/servers/:id`
- `PATCH /api/mcp/servers/:id`
- `DELETE /api/mcp/servers/:id`
- `POST /api/mcp/servers/:id/test`
- `GET /api/mcp/servers/:id/tools`

## LangGraph integration

MVP graph:

```txt
user message -> retrieve from Pinecone -> answer with citations -> persist
```

Phase 10 graph:

```txt
user message
  -> retrieve user docs
  -> if docs are weak, optionally select enabled runtime MCP tools
  -> call allowed tools
  -> answer with citations/tool metadata
  -> persist messages, tool calls, trace IDs
```

## Acceptance criteria for Phase 10

- User or admin can configure an HTTP MCP server.
- Admin can configure a stdio MCP server in trusted deployment mode.
- Server test shows available tools without leaking secrets.
- Agent can call a configured MCP tool when allowed.
- Tool calls are logged in Supabase and LangSmith.
- Disabled MCP servers are never loaded.
- User A cannot access User B's MCP configs or tool results.

## Next refinement extension

Runtime MCP is now part of the shipped codebase, and the next refinement phase separates two surfaces clearly:

- user BYO MCP in `/settings`,
- admin-managed global MCP in `/admin`.

Additional implementation requirements:

1. Global MCP configs must be stored as admin-managed records and must not expose raw secrets to the browser.
2. The runtime registry must support loading enabled global MCP plus enabled user-scoped MCP together.
3. Global MCP policy must remain compatible with the one-shared-assistant model.
4. Admins may manage global MCP definitions, but they still must not gain access to user document contents.
5. History surfaces may show MCP invocation metadata, but not raw decrypted headers, env values, or sensitive tool payloads.
