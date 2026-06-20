# VCS_WORKFLOW.md — Git and GitHub Discipline for Agents

The goal is to maintain a clean, auditable version-control history while multiple coding agents work autonomously.

## Core rule

Every completed task must end with:

1. Passing validation.
2. Updated documentation.
3. Updated progress log.
4. A task-scoped Git commit.

No task is `done` until the commit exists locally.

---

# 1. Branching model

## Default branch

- `main` is always stable.
- Do not commit directly to `main` unless this is a solo local prototype and explicitly allowed.

## Task branches

Use one branch per task:

```bash
git checkout main
git pull --ff-only
git checkout -b task/TASK-004-registration-page
```

Branch naming format:

```txt
task/TASK-ID-short-kebab-summary
```

Examples:

```txt
task/TASK-001-nextjs-foundation
task/TASK-004-registration-page
task/TASK-021-langgraph-agent
```

---

# 2. Required task workflow

For every task:

```bash
git status
```

Confirm the working tree state before editing.

Then:

1. Pick exactly one task from `TASKS.md`.
2. Create or switch to the matching task branch.
3. Update `PROGRESS_LOG.md` status to `in_progress`.
4. Implement the task.
5. Add/update tests.
6. Run relevant validation commands.
7. Update documentation impacted by the task:
   - `TASKS.md` task status if needed.
   - `PROGRESS_LOG.md` with details.
   - `design.md` if architecture/UI/API changed.
   - `UI_MOCKUPS.md` or `UI_PAGES.md` if UI changed.
   - `SECURITY.md` if auth/secrets/RLS changed.
   - `TESTING.md` if test strategy changed.
   - `ENVIRONMENT.md` if env vars changed.
8. Run final validation.
9. Commit all related changes.
10. Leave a clear summary in `PROGRESS_LOG.md`.

---

# 3. Commit format

Use task-scoped commits:

```bash
git add .
git commit -m "TASK-004: implement registration page"
```

Commit message format:

```txt
TASK-ID: imperative summary
```

Examples:

```txt
TASK-001: initialize Next.js foundation
TASK-006: add Supabase schema and RLS policies
TASK-014: index document chunks in Pinecone
TASK-021: implement LangGraph agent workflow
```

---

# 4. Commit body for larger tasks

For larger tasks, include a body:

```bash
git commit -m "TASK-021: implement LangGraph agent workflow" -m "Adds vector, date, and Tavily tools with LangSmith tracing. Includes unit tests for tool routing and updates TASKS.md and PROGRESS_LOG.md."
```

---

# 5. Pre-commit validation checklist

Before every commit, run the relevant commands:

```bash
npm run lint
npm run typecheck
npm run test
```

When UI or routing changes:

```bash
npm run test:e2e
```

When deployment or env changes:

```bash
npm run build
```

If a command cannot run because the script is not created yet, create the script if the task scope allows it. Otherwise, log the reason in `PROGRESS_LOG.md`.

---

# 6. Post-commit requirements

After commit:

```bash
git status
```

Expected result:

```txt
nothing to commit, working tree clean
```

Then log the commit hash:

```bash
git rev-parse --short HEAD
```

Add the hash to the corresponding `PROGRESS_LOG.md` task entry.

---

# 7. Pull request workflow

If GitHub remote is configured:

```bash
git push -u origin task/TASK-004-registration-page
```

Open a PR with:

- Task ID and title.
- Summary of changes.
- Tests run.
- Screenshots for UI tasks.
- Any known follow-ups.

PR title format:

```txt
TASK-004: Create registration page
```

---

# 8. Do not commit

Never commit:

- `.env`
- API keys
- Supabase service role key
- AWS credentials
- Pinecone API key
- LangSmith API key
- Tavily API key
- Generated build folders
- Local logs containing secrets

---

# 9. Recovery rules

If validation fails after implementation:

- Do not commit as completed.
- Either fix the issue or mark task `blocked`.
- Commit only if the commit is explicitly a WIP/checkpoint and label it clearly:

```txt
TASK-014: WIP document indexing blocked by Pinecone config
```

A WIP commit does not make the task `done`.

---

# 10. Documentation update rule

Documentation is part of the product. Any code change that alters behavior must update the relevant docs in the same commit.

Examples:

- New env var -> update `.env.example` and `ENVIRONMENT.md`.
- New API route -> update `design.md`.
- New UI state -> update `UI_PAGES.md` or `UI_MOCKUPS.md`.
- New security rule -> update `SECURITY.md`.
- New test command -> update `TESTING.md`.
