# SECURITY.md — Security Requirements

## Core security principles

1. User data must be isolated by Supabase Auth user ID.
2. RLS must be enabled on all user-owned tables.
3. User-facing API routes must use authenticated session user ID.
4. Client-submitted `user_id` must be ignored.
5. Raw API keys must never be exposed to the browser.
6. Raw API keys must never be written to logs or LangSmith traces.
7. S3 documents must be private.
8. Pinecone namespaces or metadata filters must prevent cross-user retrieval.

## Supabase RLS expectations

Enable RLS on:

- `profiles`
- `user_model_settings`
- `documents`
- `document_chunks`
- `chat_sessions`
- `chat_messages`
- `agent_tool_calls`

Policy pattern:

```sql
using (auth.uid() = user_id)
with check (auth.uid() = user_id)
```

For `profiles`, use:

```sql
using (auth.uid() = id)
with check (auth.uid() = id)
```

Also enforce ownership at the relational layer with composite foreign keys for user-owned child tables such as:

- `document_chunks (document_id, user_id) -> documents (id, user_id)`
- `chat_messages (session_id, user_id) -> chat_sessions (id, user_id)`
- `agent_tool_calls (session_id, user_id) -> chat_sessions (id, user_id)`

This prevents a user-owned row from pointing at another user's parent record even if an attacker learns a UUID.

## API route auth pattern

Every protected route must:

1. Create server Supabase client.
2. Read authenticated user from session.
3. Return 401 if no user exists.
4. Use server-derived `user.id` for all queries/mutations.
5. Validate request body with Zod.

## Secret handling

- `NEXT_PUBLIC_*` variables are browser-visible. Only Supabase URL and anon key may use this prefix.
- Provider API keys must be server-only.
- Settings API may accept keys, but must not return raw keys.
- Saved keys must be masked in the UI.
- Prefer server environment keys for MVP.
- Add production TODO for encryption/KMS if user-owned keys are persisted.

## S3 rules

- Use private bucket/object settings.
- Object keys should include user and document identifiers but should not expose sensitive filenames unnecessarily.
- Do not render S3 URLs to the user for MVP.
- Use server-side reads during processing.

## Pinecone isolation

Use one of these patterns:

Preferred MVP:

```txt
namespace = user:{userId}
vectorId = {userId}:{documentId}:{chunkIndex}
```

Also store metadata:

```json
{
  "userId": "...",
  "documentId": "...",
  "fileName": "...",
  "chunkIndex": 0,
  "contentPreview": "..."
}
```

All vector queries must use the authenticated user's namespace.

## LangSmith redaction

Do not include these fields in trace metadata:

- API keys
- Authorization headers
- Supabase service role key
- S3 credentials
- Full raw document text if sensitive

Safe trace metadata:

- user ID
- session ID
- document ID
- chunk count
- tool name
- latency
- status
- run ID

## Security task completion criteria

Security-related tasks are complete only when tests prove:

- Unauthenticated access fails.
- Cross-user access fails.
- Raw keys are not exposed.
- Tool calls are user-scoped.
- RLS is enabled and validated.


## Version-control security

Never commit secrets or local environment files.

Required `.gitignore` coverage:

```txt
.env
.env.local
.env.*.local
.next/
node_modules/
coverage/
playwright-report/
test-results/
*.log
```

Before every commit, run:

```bash
git diff --cached
```

Confirm no secrets, raw API keys, service-role keys, signed URLs, or sensitive logs are staged.

# Runtime MCP security rules

Runtime MCP configs are high-risk because they may connect to external services or start local processes.

Rules:

1. Runtime MCP is disabled by default for MVP.
2. MCP configs must be stored server-side only.
3. HTTP headers and stdio env values must be encrypted.
4. Hashes/fingerprints may be stored only for audit/deduplication, never as a replacement for encryption.
5. Browser APIs must never return raw or encrypted secret payloads.
6. stdio MCP commands require a production allowlist.
7. All MCP calls require timeouts.
8. Tool inputs and outputs must be redacted before database logging.
9. User-scoped MCP configs must be isolated with RLS.
10. Disabled MCP servers must not be loaded by the agent.
