# Important distinction: development MCP vs runtime MCP

This file describes MCP servers used by Codex/coding agents to build and validate the project.

The product's own Agentic RAG assistant will later support configurable runtime MCP servers. That runtime design is documented separately in `AGENTIC_RAG_MCP.md` and supports both `stdio` and `http` transports.

For the first MVP, runtime MCP is intentionally deferred. The MVP assistant should use built-in server-side tools only: user-scoped Pinecone vector search and a deterministic date/time utility.

# MCP_SERVERS.md — MCP Usage Plan for Coding Agents

## Purpose

Use MCP servers to speed up implementation, validation, debugging, and observability. MCP usage must never override security rules in `SECURITY.md`.

## Required MCP areas

| Area | MCP server | Agent use |
|---|---|---|
| Next.js frontend/backend | Next.js DevTools MCP | Inspect routes, runtime errors, hydration issues, server/client boundaries, and build diagnostics. |
| Supabase | Supabase MCP | Manage schema, inspect tables, validate RLS, query test data, debug auth/session issues. |
| Pinecone | Pinecone MCP | Check/create index, inspect namespaces, validate vector upserts, test vector search. |
| LangSmith | LangSmith MCP | Inspect agent traces, runs, prompt behavior, tool calls, and failed executions. |
| Tavily | Tavily MCP | Validate web search tool responses, extraction, timeout/error behavior. |
| AWS/S3 | AWS MCP or S3-compatible MCP | Validate bucket policies, object writes, private object access, and signed access flows. |

## MCP safety rules

1. Prefer read-only mode where possible.
2. Do not expose secrets in MCP prompts, logs, or generated files.
3. Do not use service-role credentials in browser code.
4. Use write-capable MCP operations only for explicitly assigned infrastructure tasks.
5. Record any schema/index/bucket mutation in `PROGRESS_LOG.md`.

## Recommended MCP setup file

Create `.mcp.json` or configure Codex with equivalent project-level MCP configuration. Exact command values may vary by local environment.

```json
{
  "mcpServers": {
    "nextjs-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"]
    },
    "pinecone": {
      "command": "npx",
      "args": ["-y", "@pinecone-database/mcp"]
    },
    "langsmith": {
      "command": "npx",
      "args": ["-y", "@langchain/langsmith-mcp-server"]
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"]
    }
  }
}
```

If package names differ in the implementation environment, Codex must verify the correct package name before installing.

## MCP-by-task guidance

- TASK-001 to TASK-003: Use Next.js DevTools MCP and Supabase MCP.
- TASK-006: Use Supabase MCP to validate schema and RLS.
- TASK-034 to TASK-036: Keep runtime MCP configs in Supabase only; use development MCPs only to validate schema, RLS, and API behavior.
- TASK-010: Use S3-compatible MCP for object upload checks.
- TASK-014 and TASK-018: Use Pinecone MCP to validate namespaces, vectors, and queries.
- TASK-020: Use Tavily MCP to validate search responses.
- TASK-021 to TASK-023: Use LangSmith MCP to inspect traces and tool calls.
- TASK-028 to TASK-033: Use all relevant MCPs for smoke testing.
