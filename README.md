# RAGFlow Studio

RAGFlow Studio is a Next.js MVP for authenticated document ingestion and chat-based retrieval.

## Local development

```bash
npm install
npm run dev -- --hostname 127.0.0.1
```

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Production deployment

RAGFlow Studio now builds with Next.js `output: "standalone"` so production environments can run the generated server artifact directly.

Typical deployment flow:

```bash
npm ci
npm run build
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Set the server-only runtime secrets from `.env.example` in the deployment platform before starting the standalone server.

## Project docs

This repository also contains the operating documents for Codex/coding agents building the RAGFlow Studio MVP.

## Files
- `UI_MOCKUPS.md` — low-fidelity wireframes and UI states for all MVP pages.
- `UI_PAGES.md` — page-level implementation specs and component breakdown.
- `VCS_WORKFLOW.md` — Git branch, commit, validation, and documentation workflow for agents.
- `GITHUB.md` — GitHub repository setup, PR template, CI, and branch protection guidance.

- `AGENTS.md` — global operating rules for all agents.
- `design.md` — product, architecture, data model, routes, UI, and integration design.
- `TASKS.md` — granular task list with acceptance criteria and validation commands.
- `MCP_SERVERS.md` — MCP server usage plan for Next.js, Supabase, Pinecone, LangSmith, Tavily, and S3.
- `TESTING.md` — unit, integration, E2E, security, and smoke testing strategy.
- `SECURITY.md` — security requirements, RLS expectations, and secret-handling rules.
- `PROGRESS_LOG.md` — task-progress tracker template agents must update.
- `ENVIRONMENT.md` — required environment variables and setup notes.
- `.env.example` — copy to `.env.local` and fill values locally.

## Codex startup instruction

Before writing code, Codex must read these files in this order:

1. `AGENTS.md`
2. `design.md`
3. `TASKS.md`
4. `SECURITY.md`
5. `TESTING.md`
6. `MCP_SERVERS.md`
7. `PROGRESS_LOG.md`

Codex must work on one task ID at a time and update `PROGRESS_LOG.md` after each validated task.

## Latest update: MVP-first delivery and runtime MCP configuration

This pack now separates the delivery into two layers:

1. **MVP-first core**: auth, upload, parse, chunk, embed, Pinecone index, and simple user-document RAG chat.
2. **Later configurable system**: per-user models, thinking levels, credentials, Tavily, and runtime Agentic RAG MCP servers.

New files:

- `MVP_FIRST.md` — phase gates and what must be built first.
- `AGENTIC_RAG_MCP.md` — future runtime MCP configuration for the product's own Agentic RAG assistant, supporting `stdio` and `http` transports.

Codex must prioritize `MVP_FIRST.md` over advanced configuration tasks until the MVP smoke test passes.
