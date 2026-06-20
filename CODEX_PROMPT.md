# MVP-FIRST PRIORITY OVERRIDE

Before implementing advanced configuration, first complete the default working MVP:

1. Supabase login/registration/authentication.
2. Protected app shell.
3. Document upload to private S3.
4. TXT/Markdown parsing.
5. Chunking.
6. Default server-side embedding.
7. Pinecone indexing in authenticated user namespace.
8. Simple RAG chat over the user's own documents.
9. Chat session and message persistence.
10. MVP smoke tests.

Do not implement configurable runtime MCP, Tavily, per-user model routing, or thinking controls until the MVP path is validated unless the selected task is explicitly from the later-phase task list.

# CODEX_PROMPT.md — Bootstrap Prompt for Codex

You are implementing RAGFlow Studio, a one-day MVP Agentic RAG app.

Before coding, read:

1. `AGENTS.md`
2. `design.md`
3. `TASKS.md`
4. `SECURITY.md`
5. `TESTING.md`
6. `MCP_SERVERS.md`
7. `PROGRESS_LOG.md`

Then execute tasks in order. Work on only one task ID at a time. Update `PROGRESS_LOG.md` before starting and after validation. Add tests for every implemented task. Never expose secrets. Never bypass Supabase RLS. Use authenticated server-derived user IDs only.

Start with `TASK-001` unless the user explicitly assigns a different task.


## Additional required behavior

You must maintain proper version control discipline.

For every task:

1. Read `AGENTS.md`, `TASKS.md`, `design.md`, `UI_MOCKUPS.md`, `UI_PAGES.md`, `TESTING.md`, `SECURITY.md`, and `VCS_WORKFLOW.md` before coding.
2. Pick exactly one task.
3. Create a task branch.
4. Implement and test the task.
5. Update all affected documentation.
6. Update `PROGRESS_LOG.md`.
7. Commit the completed task with a task-scoped commit message.
8. Record the commit hash in `PROGRESS_LOG.md`.
9. Do not mark the task `done` until the working tree is clean.

For UI tasks, follow `UI_MOCKUPS.md` and `UI_PAGES.md`. Include screenshots in the PR when GitHub is configured.
