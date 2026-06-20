# AGENTS.md — Codex Operating Instructions

## Product

Build **RAGFlow Studio**, a one-day MVP Agentic RAG application using Next.js, Supabase, S3, Pinecone, LangChain.js/LangGraph.js, LangSmith, and Tavily.

## Mission

Implement the product in small, validated increments. Every task must include tests and must be logged before being marked complete.

## Non-negotiable rules

1. Work on exactly one task ID from `TASKS.md` at a time.
2. Before starting work, update the task status in `PROGRESS_LOG.md` to `in_progress`.
3. Do not mark a task `done` until implementation, tests, and validation commands pass.
4. Do not store secrets in frontend code.
5. Do not expose raw API keys through API responses, logs, traces, or browser state.
6. Do not bypass Supabase RLS in user-facing API routes.
7. Derive `user_id` from the authenticated server session; never trust a client-submitted `user_id`.
8. Keep code TypeScript-first and strictly typed.
9. Prefer simple MVP-safe implementation over over-engineering.
10. If blocked, log the blocker in `PROGRESS_LOG.md` and continue only with independent work.

## Required reading before coding

Read these files first:

- `design.md`
- `TASKS.md`
- `SECURITY.md`
- `TESTING.md`
- `MCP_SERVERS.md`
- `ENVIRONMENT.md`
- `UI_MOCKUPS.md`
- `UI_PAGES.md`
- `VCS_WORKFLOW.md`
- `GITHUB.md`

## Standard task workflow with VCS

For each task:

1. Run `git status` and confirm the current branch/working tree.
2. Pick exactly one task from `TASKS.md`.
3. Create a task branch using `task/TASK-ID-short-summary` unless already on the correct branch.
4. Set the matching entry in `PROGRESS_LOG.md` to `in_progress`.
5. Inspect related code, docs, tests, and mockups.
6. Implement the smallest complete change.
7. Add or update tests for the task.
8. Run validation commands relevant to the task.
9. Update all affected documentation in the same change:
   - `TASKS.md`
   - `PROGRESS_LOG.md`
   - `design.md`
   - `UI_MOCKUPS.md`
   - `UI_PAGES.md`
   - `SECURITY.md`
   - `TESTING.md`
   - `ENVIRONMENT.md`
   - `MCP_SERVERS.md`
10. Set status to `validated` only after validation passes.
11. Commit the completed task with a task-scoped commit message.
12. Record the commit hash in `PROGRESS_LOG.md`.
13. Set status to `done` only after the commit exists and the working tree is clean.

A task is not complete until code, tests, docs, progress log, and Git commit are all complete.

## Coding conventions

- Use Next.js App Router.
- Use server components by default where possible.
- Use client components only for interactivity.
- Use route handlers for backend APIs.
- Use Zod for every API input boundary.
- Use typed server-side helpers for Supabase, Pinecone, S3, embeddings, and tools.
- Use feature-oriented folders under `src/server` and `src/components`.
- Keep UI components composable and accessible.
- Prefer clear names over abbreviations.

## Suggested folder structure

```txt
src/
  app/
    (auth)/
      login/
      register/
    (app)/
      chat/
      documents/
      settings/
    api/
      auth/
      chat/
      documents/
      settings/
      tools/
  components/
    app-shell/
    auth/
    chat/
    documents/
    settings/
    ui/
  lib/
    env.ts
    validations/
    constants.ts
  server/
    auth/
    supabase/
    s3/
    pinecone/
    documents/
    embeddings/
    agent/
    tools/
    logging/
    langsmith/
  types/
  tests/
```

## Commit discipline

Use task-scoped commits for every completed task. Follow `VCS_WORKFLOW.md`.

```bash
git add .
git commit -m "TASK-004: implement registration page"
git rev-parse --short HEAD
```

Record the resulting commit hash in `PROGRESS_LOG.md`.

## Default validation commands

Run the commands relevant to the task:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

If a command is unavailable early in the project, create the script or log why it cannot run yet.

## Failure policy

When a task fails validation:

- Keep status as `blocked` or `in_progress`.
- Record the exact failing command.
- Record the error summary.
- Do not hide failures.
- Do not mark the task complete.

## UI style baseline

Use the dark glowing graph/network visual direction from `design.md`:

- Primary background: Black Pearl `#050816`
- Primary action: Violet `#7C3AED`
- Secondary action/highlight: Aqua `#06B6D4`
- Text: Ice White `#F9FAFB`
- Accents: Magenta `#D946EF`, Emerald `#10B981`, Blue Glow `#2563EB`
- Headings: Sora
- Body: Inter
- Code: JetBrains Mono

# MVP-first task priority

Agents must treat the default working MVP as the highest priority. A later-phase task must not be selected while any MVP-critical task is incomplete unless explicitly instructed by the project owner.

MVP-critical tasks are:

- authentication and protected routing,
- document upload,
- parsing,
- chunking,
- embedding,
- Pinecone indexing,
- simple user-scoped document chat,
- chat persistence,
- smoke tests.

## Runtime Agentic RAG MCP configuration rule

Runtime MCP configuration is documented in `AGENTIC_RAG_MCP.md`. It is a later-phase product capability, not required for the initial MVP. When implemented, the agent must support both `stdio` and `http` MCP transports, but all MCP configs and secrets must remain server-side.
