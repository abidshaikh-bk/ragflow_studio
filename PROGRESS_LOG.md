# PROGRESS_LOG.md — Agent Progress Tracker

Agents must update this file before starting and after validating each task.

## Status values

- `not_started`
- `in_progress`
- `blocked`
- `validated`
- `review_required`
- `done`

## Task log template

```md
## TASK-000: Task title

Status: not_started | in_progress | blocked | validated | review_required | done

Owner Agent:
Started:
Completed:

### Objective

### Files Changed
- 

### Implementation Notes
- 

### Tests Added
- 

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
```

### Result
Pass | Fail

### Blockers
- 

### Follow-up
- 
```

---

## TASK-001: Initialize Next.js project

Status: done

Owner Agent: Codex
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Create the Next.js App Router project with TypeScript and Tailwind.

### Files Changed
- .gitignore
- .mcp.json
- README.md
- package-lock.json
- package.json
- playwright.config.ts
- postcss.config.mjs
- public/ragflow-logo.png
- src/app/globals.css
- src/app/icon.png
- src/app/layout.tsx
- src/app/page.tsx
- src/components/app-shell/AppLogo.tsx
- src/tests/e2e/.gitkeep
- src/tests/homepage.test.tsx
- src/tests/setup.ts
- tailwind.config.ts
- tsconfig.json
- vitest.config.ts
- next.config.ts
- next-env.d.ts
- .eslintrc.json

### Implementation Notes
- Added a minimal Next.js App Router scaffold with TypeScript, Tailwind CSS, Vitest, and Playwright scripts.
- Wired `source/icon.png` into the app as the visible logo and app icon.
- Added project-level `.mcp.json` based on `MCP_SERVERS.md` so Codex-compatible MCP setup is present in the repo.
- Validation completed on branch `task/TASK-001-nextjs-foundation`.
- Task commit created: `ecd28dd`

### Tests Added
- `src/tests/homepage.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run dev
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Proceed to the next MVP-critical task on a new task branch.

---

## TASK-002: Add shared UI shell

Status: done

Owner Agent: Codex
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Create reusable app layout, navigation, loading states, error components, and protected page shell.

### Files Changed
- src/app/(app)/chat/page.tsx
- src/app/(app)/documents/page.tsx
- src/app/(app)/error.tsx
- src/app/(app)/layout.tsx
- src/app/(app)/loading.tsx
- src/app/(app)/settings/page.tsx
- src/components/app-shell/AppShell.tsx
- src/components/app-shell/ProtectedPagePlaceholder.tsx
- src/components/app-shell/TopNav.tsx
- src/components/app-shell/UserMenu.tsx
- src/components/ui/EmptyState.tsx
- src/components/ui/ErrorAlert.tsx
- src/components/ui/Spinner.tsx
- src/tests/app-shell.test.tsx
- tsconfig.json
- vitest.config.ts

### Implementation Notes
- Added a reusable protected workspace shell with top navigation, active-route highlighting, and a placeholder user/logout control.
- Added shared loading, empty, and error UI components plus route-level loading and error files for the protected app group.
- Added lightweight `/chat`, `/documents`, and `/settings` placeholders that reuse the shell without pre-empting the fuller page-scaffolding task.
- Task commit created: `e80cb51`

### Tests Added
- `src/tests/app-shell.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Proceed to the next MVP-critical task on a new task branch.

---

## TASK-003: Configure Supabase client/server utilities

Status: done

Owner Agent: Codex
Git Branch: task/TASK-003-supabase-auth-utilities
Commit Hash: 808a8e1
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Set up Supabase client and server helpers.

### Files Changed
- middleware.ts
- package-lock.json
- package.json
- src/app/(app)/layout.tsx
- src/components/app-shell/AppShell.tsx
- src/components/app-shell/TopNav.tsx
- src/components/app-shell/UserMenu.tsx
- src/lib/env.ts
- src/lib/supabase/browser.ts
- src/server/auth/session.ts
- src/server/supabase/middleware.ts
- src/server/supabase/server.ts
- src/tests/supabase-auth.test.tsx

### Implementation Notes
- Added shared Supabase environment helpers plus browser and server clients for Next.js App Router usage.
- Added middleware-based protection for `/chat`, `/documents`, and `/settings`, and redirect handling for authenticated users hitting `/login` or `/register`.
- Updated the protected app layout to require a server-derived authenticated user before rendering page content.

### Tests Added
- `src/tests/supabase-auth.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Proceed to the next unfinished Phase 2 task on its own task branch.

---

## TASK-004: Create registration page

Status: done

Owner Agent: Codex
Git Branch: task/TASK-004-registration-page
Commit Hash: 9803370
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Build registration page using Supabase Auth.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/components/auth/RegisterForm.tsx
- src/tests/auth-forms.test.tsx

### Implementation Notes
- Replaced the registration placeholder submit path with Supabase Auth signup using the shared browser client helper.
- Added redirect behavior to `/chat` when Supabase returns a session and to `/login` when email confirmation is required.
- Preserved client-side required-field and password-match validation with clearer success and error states.

### Tests Added
- Expanded `src/tests/auth-forms.test.tsx` to cover required-field validation and successful Supabase signup redirects.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Proceed to the next unfinished Phase 2 task on its own task branch.

---

## TASK-005: Create login page

Status: done

Owner Agent: Codex
Git Branch: task/TASK-005-login-page
Commit Hash: d3179f2
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Build login page using Supabase Auth.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/components/auth/LoginForm.tsx
- src/tests/auth-forms.test.tsx

### Implementation Notes
- Replaced the login placeholder submit path with Supabase Auth `signInWithPassword` using the shared browser client helper.
- Added success redirect behavior to `/chat` after successful authentication while keeping visible error handling for invalid credentials.
- Preserved simple client-side required-field validation in the login form.

### Tests Added
- Expanded `src/tests/auth-forms.test.tsx` to cover required-field login validation, successful sign-in redirects, and invalid-credential errors.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Proceed to the next unfinished Phase 2 task on its own task branch.

---

## TASK-006: Create Supabase schema and RLS policies

Status: done

Owner Agent: Codex
Git Branch: task/TASK-006-supabase-schema-rls
Commit Hash: 65b0166
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Create database tables and row-level security policies.

### Files Changed
- DATABASE_SCHEMA.md
- ENVIRONMENT.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- package-lock.json
- package.json
- scripts/apply-supabase-migration.mjs
- src/tests/database-schema.test.ts
- supabase/migrations/0001_core_schema.sql

### Implementation Notes
- Completed the repository-side Supabase schema work: explicit CRUD RLS policies, ownership-preserving composite foreign keys, automatic `updated_at` triggers, a profile-on-signup trigger, and migration/apply tooling.
- Added a dedicated live database validation path with `npm run db:migrate` and `npm run test:db` so schema/RLS verification runs against the configured Supabase project instead of only static SQL assertions.
- Ran the local app through `npm run dev` and verified `/login`, `/register`, and protected `/chat` behavior over localhost. No code-level runtime regressions were found; the only runtime wrinkle was sandbox port binding, solved by running the dev server with terminal escalation.

### Tests Added
- `src/tests/database-schema.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:migrate
npm run test:db
```

### Result
- `npm run lint`: Pass
- `npm run typecheck`: Pass
- `npm run test`: Pass
- `npm run build`: Pass
- `npm run db:migrate`: Pass
- `npm run test:db`: Pass

### Blockers
- None

### Follow-up
- Proceed to the next unfinished task on its own task branch.

---

## TASK-007: Build settings UI

Status: done

Owner Agent: Codex
Git Branch: task/TASK-007-build-settings-ui
Commit Hash: 4226fef
Started: 2026-06-20
Completed: 2026-06-20

### Objective

Create the interactive settings page for model and embedding configuration.

### Files Changed

- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- UI_PAGES.md
- package.json
- src/components/settings/ProviderSelect.tsx
- src/components/settings/SaveBar.tsx
- src/components/settings/SecretInput.tsx
- src/components/settings/SettingsForm.tsx
- src/tests/page-scaffolds.test.tsx
- src/tests/settings-form.test.tsx

### Implementation Notes

- Replaced the read-only settings placeholder with an interactive client form for provider, model, and secret inputs.
- Added client-side validation for required provider/model fields and a save flow that clears raw secret inputs while keeping masked secret indicators visible after save.
- Updated the shared provider, secret, and save-bar components so the UI can be reused by the real API wiring in TASK-008.
- Hardened the typecheck script so Next route types are generated before `tsc --noEmit`.

### Tests Added

- `src/tests/settings-form.test.tsx`

### Documentation Updated

- [x] TASKS.md
- [x] PROGRESS_LOG.md
- [ ] design.md
- [x] UI_MOCKUPS.md / UI_PAGES.md
- [ ] SECURITY.md
- [x] TESTING.md
- [ ] ENVIRONMENT.md

### Git / VCS

- Branch: task/TASK-007-build-settings-ui
- Commit: 4226fef
- Working tree clean after commit: yes

### Validation Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result

- `npm run lint`: Pass
- `npm run typecheck`: Pass
- `npm run test`: Pass
- `npm run build`: Pass

### Blockers

- None

### Follow-up

- Continue to TASK-008 on its own branch.

---

## TASK-008: Build settings API

Status: done

Owner Agent: Codex
Git Branch: task/TASK-008-build-settings-api
Commit Hash: 437e8d3
Started: 2026-06-20
Completed: 2026-06-20

### Objective

Persist and retrieve user model settings through secure authenticated API routes.

### Files Changed

- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- package-lock.json
- package.json
- src/app/(app)/settings/page.tsx
- src/app/api/settings/route.ts
- src/components/settings/SettingsForm.tsx
- src/components/settings/SettingsPageClient.tsx
- src/lib/validations/settings.ts
- src/server/settings/service.ts
- src/tests/page-scaffolds.test.tsx
- src/tests/settings-route.test.ts
- tsconfig.json

### Implementation Notes

- Added authenticated `GET /api/settings` and `POST /api/settings` route handlers with Zod validation on write requests.
- Added a server-side settings service that persists provider/model choices and stores only safe credential metadata such as hashes and masked last-four indicators.
- Wired the settings page to load and save through `/api/settings` while keeping raw API key inputs client-side only and clearing them after save.
- Stabilized the project `typecheck` script around Next route type generation so the default validation command is reliable.

### Tests Added

- `src/tests/settings-route.test.ts`

### Documentation Updated

- [x] TASKS.md
- [x] PROGRESS_LOG.md
- [ ] design.md
- [ ] UI_MOCKUPS.md / UI_PAGES.md
- [ ] SECURITY.md
- [x] TESTING.md
- [ ] ENVIRONMENT.md

### Git / VCS

- Branch: task/TASK-008-build-settings-api
- Commit: 437e8d3
- Working tree clean after commit: yes

### Validation Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result

- `npm run lint`: Pass
- `npm run typecheck`: Pass
- `npm run test`: Pass
- `npm run build`: Pass

### Blockers

- None

### Follow-up

- Push the completed Phase 3 branch history to GitHub.


---

## TASK-002A: Add UI mockup reference docs

Status: done
Owner Agent: Codex
Git Branch: task/TASK-002A-ui-mockup-reference-docs
Commit Hash: pending_commit
Started: 2026-06-20
Completed: 2026-06-20

### Objective

Add UI mockups and page-level implementation specs for all MVP screens.

### Files Changed

- UI_MOCKUPS.md
- UI_PAGES.md
- design.md
- TASKS.md
- PROGRESS_LOG.md

### Implementation Notes

- Validated the existing UI mockup and page-spec documentation files, confirmed core doc references, and added Phase 1A scaffold notes clarifying local-only placeholder behavior.

### Tests Added

- None. This task validates required documentation files and cross-references.

### Documentation Updated

- [x] TASKS.md
- [x] PROGRESS_LOG.md
- [ ] design.md
- [x] UI_MOCKUPS.md / UI_PAGES.md

### Git / VCS

- Branch:
- Commit:
- Working tree clean after commit: no

### Validation Commands

```bash
test -f UI_MOCKUPS.md
test -f UI_PAGES.md
```

### Result

Pass

### Blockers

- None

### Follow-up

- Proceed to Phase 2 auth wiring using the scaffolded route structure.

---

## TASK-002B: Implement shared design system primitives

Status: done

Owner Agent: Codex
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Create reusable UI primitives matching the dark glowing RAGFlow Studio design language.

### Files Changed
- src/components/ui/Button.tsx
- src/components/ui/Input.tsx
- src/components/ui/Select.tsx
- src/components/ui/Card.tsx
- src/components/ui/Badge.tsx
- src/components/ui/Progress.tsx
- src/components/ui/Toast.tsx
- src/app/globals.css
- tailwind.config.ts
- src/tests/ui-primitives.test.tsx

### Implementation Notes
- Added the core button, form, card, badge, progress, and toast primitives and aligned focus/disabled behavior with the project design tokens.
- Preserved the existing shared feedback components and wired typography tokens for heading, body, and mono use.

### Tests Added
- `src/tests/ui-primitives.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Use these primitives as the base layer for the Phase 2 auth and data-entry tasks.

---

## TASK-002C: Scaffold all MVP pages from mockups

Status: done

Owner Agent: Codex
Started: 2026-06-20
Completed: 2026-06-20

### Objective
Create initial page scaffolds for Login, Register, Chat, Documents, and Settings.

### Files Changed
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/(app)/chat/page.tsx
- src/app/(app)/documents/page.tsx
- src/app/(app)/settings/page.tsx
- src/components/auth/*
- src/components/chat/*
- src/components/documents/*
- src/components/settings/*
- src/tests/auth-forms.test.tsx
- src/tests/page-scaffolds.test.tsx
- UI_PAGES.md

### Implementation Notes
- Replaced the protected-page placeholders with full mockup-aligned scaffolds for auth, chat, documents, and settings.
- Kept interactions local-only where backend work is intentionally deferred, while preserving the intended page structure, states, and accessibility hooks.
- Kept `/settings` read-only per the MVP-first policy in `UI_PAGES.md`.

### Tests Added
- `src/tests/auth-forms.test.tsx`
- `src/tests/page-scaffolds.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Phase 2 should replace local placeholder submits with real Supabase-backed auth and protected-session behavior.

---

## TASK-009: Build document upload page

Status: done

Owner Agent: Codex
Git Branch: task/TASK-009-build-document-upload-page
Started: 2026-06-21
Completed: 2026-06-21
Commit Hash: b423419

### Objective
Create the document upload UI with live progress states for the document ingestion workspace.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- UI_PAGES.md
- src/app/(app)/documents/page.tsx
- src/components/documents/DocumentDropzone.tsx
- src/components/documents/DocumentStatusBadge.tsx
- src/components/documents/DocumentTable.tsx
- src/components/documents/DocumentsWorkspace.tsx
- src/components/documents/ProcessingTimeline.tsx
- src/components/documents/UploadProgressCard.tsx
- src/components/documents/types.ts
- src/tests/documents-page.test.tsx

### Implementation Notes
- Replaced the static documents scaffold with a client-side workspace that simulates supported uploads, live ingestion stages, and terminal success and failure states.
- Kept the implementation local-only so the page stays within `TASK-009` scope while clearly handing off real storage and API work to `TASK-010`.
- Expanded the document history and progress panels to reflect active stage, chunk progress, and surfaced processing errors.

### Tests Added
- `src/tests/documents-page.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Proceed to `TASK-010` on the next task branch.

---

## TASK-010: Implement S3 upload API

Status: done

Owner Agent: Codex
Git Branch: task/TASK-010-live-s3-upload
Started: 2026-06-21
Completed: 2026-06-21
Commit Hash: 5a3f37b, ec52ed6

### Objective
Upload raw files to S3, create a user-scoped Supabase document record, and return the new document id.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- package-lock.json
- package.json
- src/app/api/documents/upload/route.ts
- src/components/documents/DocumentDropzone.tsx
- src/components/documents/DocumentsWorkspace.tsx
- src/lib/env.ts
- src/lib/validations/documents.ts
- src/server/documents/upload.ts
- src/server/s3/client.ts
- src/tests/document-upload-route.test.ts
- src/tests/document-upload-service.test.ts
- src/tests/documents-page.test.tsx

### Implementation Notes
- Added a multipart upload route that authenticates the request server-side, rejects missing or invalid files, and returns only the new document id plus status.
- Added typed document-upload validation, a server-only S3 client, and a document upload service that stores the raw file in a private S3 key and inserts a user-scoped `documents` row.
- Added `@aws-sdk/client-s3` as the storage dependency for the MVP upload flow.
- Wired the Documents page to the live upload API so successful uploads now hit private S3 before the local processing simulation continues.
- Added S3 rollback on Supabase insert failure and verified a real smoke upload with `HeadObject` against bucket `ragflow-studio`.

### Tests Added
- `src/tests/document-upload-route.test.ts`
- `src/tests/document-upload-service.test.ts`
- `src/tests/documents-page.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Continue to `TASK-011` on the next task branch.

---

## TASK-011: Implement document parser

Status: done

Owner Agent: Codex
Git Branch: task/TASK-011-implement-document-parser
Started: 2026-06-21
Completed: 2026-06-21
Commit Hash: 0931dcd

### Objective
Extract text from uploaded documents, update parsing status, and record failures on the document row.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/server/documents/parser.ts
- src/tests/document-parser.test.ts

### Implementation Notes
- Added a server-side parser utility that supports TXT and Markdown for the MVP, updates the document row to `parsing`, and marks the document `failed` with an error message on parse failures.
- Kept the parser focused on text extraction so later chunking and processing tasks can compose it directly without reworking status handling.

### Tests Added
- `src/tests/document-parser.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Continue to `TASK-012` on the next task branch.

---

## TASK-012: Implement chunking pipeline

Status: done

Owner Agent: Codex
Git Branch: task/TASK-012-implement-chunking-pipeline
Started: 2026-06-21
Completed: 2026-06-21
Commit Hash: c6b334e

### Objective
Chunk parsed document text, preserve source metadata, and insert user-scoped `document_chunks` rows.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/server/documents/chunking.ts
- src/tests/document-chunking.test.ts

### Implementation Notes
- Added a server-side chunking utility that updates the document to `chunking`, creates overlapping chunks with stable vector ids, inserts `document_chunks` rows, and updates chunk progress on the parent document.
- Added failure handling so empty parsed text or persistence errors mark the document `failed` with a clear error message.

### Tests Added
- `src/tests/document-chunking.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Continue to `TASK-013` on the next task branch.

---

## TASK-013: Implement embedding generation

Status: done

Owner Agent: Codex
Git Branch: task/TASK-013-implement-embedding-generation
Started: 2026-06-21
Completed: 2026-06-21
Commit Hash: b696f67

### Objective
Generate embeddings for document chunks in batches, resolve the embedding model configuration safely, and track progress on the parent document.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/server/embeddings/service.ts
- src/tests/document-embeddings.test.ts

### Implementation Notes
- Added a server-side embedding service that resolves the effective embedding provider/model, batches chunk text, updates document status to `embedding`, and tracks processed chunk counts as batches complete.
- Kept the runtime MVP-safe by supporting server-managed OpenAI embeddings directly and marking the document `failed` on provider or progress-update errors.

### Tests Added
- `src/tests/document-embeddings.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Continue to `TASK-014` on the next task branch.

---

## TASK-014: Implement Pinecone indexing

Status: done

Owner Agent: Codex
Git Branch: task/TASK-014-implement-pinecone-indexing
Commit Hash: eebae79
Started: 2026-06-21
Completed: 2026-06-21

### Objective
Store document vectors in Pinecone under the authenticated user's namespace and mark the document completed.

### Files Changed
- TASKS.md
- package-lock.json
- package.json
- PROGRESS_LOG.md
- src/app/api/documents/upload/route.ts
- src/lib/env.ts
- src/server/documents/process.ts
- src/server/embeddings/service.ts
- src/server/pinecone/client.ts
- src/server/pinecone/indexing.ts
- src/tests/document-processing.test.ts
- src/tests/document-upload-route.test.ts
- src/tests/pinecone-indexing.test.ts

### Implementation Notes
- Added a typed Pinecone indexing service that builds user-scoped vector payloads, writes them into the authenticated user's namespace, and marks documents `completed` only after the upsert succeeds.
- Added a server-side Pinecone client helper using the official `@pinecone-database/pinecone` SDK and environment-backed index targeting.
- Added `processUploadedDocument` to chain parsing, chunking, embedding generation, and Pinecone indexing after a successful upload.
- Updated the upload route to kick off the ingestion pipeline after the S3 object and Supabase document record are created, while preserving the existing API response contract.
- Full validation passed locally. A live Pinecone smoke upsert could not run in this workspace because `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` are currently blank in `.env` and `.env.local`.

### Tests Added
- `src/tests/document-processing.test.ts`
- `src/tests/pinecone-indexing.test.ts`
- Expanded `src/tests/document-upload-route.test.ts` to verify background document processing starts after upload.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Populate `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` locally to run a live namespace smoke upsert against the configured index.

---

## TASK-015: Add live document status polling

Status: done

Owner Agent: Codex
Git Branch: task/TASK-015-live-document-status-polling
Commit Hash: c7a3f5f
Started: 2026-06-21
Completed: 2026-06-21

### Objective
Show live ingestion progress by polling the authenticated user's document status from the backend until processing completes or fails.

### Files Changed
- TASKS.md
- PROGRESS_LOG.md
- src/app/api/documents/[documentId]/status/route.ts
- src/components/documents/DocumentsWorkspace.tsx
- src/components/documents/UploadProgressCard.tsx
- src/components/documents/types.ts
- src/lib/validations/documents.ts
- src/server/documents/status.ts
- src/tests/document-status-route.test.ts
- src/tests/documents-page.test.tsx

### Implementation Notes
- Added an authenticated `GET /api/documents/:id/status` route backed by a typed server helper that only returns the current user's document status snapshot.
- Replaced the live-upload UI's local progress simulation with backend polling for real uploads while preserving the preview failure simulator for UI QA.
- Polling now starts immediately after a successful upload, refreshes every 1.2 seconds, stops on `completed` or `failed`, and updates chunk progress plus the active timeline stage from the backend response.
- Updated the progress card messaging to reflect live ingestion instead of the previous mock-only pipeline copy.

### Tests Added
- `src/tests/document-status-route.test.ts`
- Expanded `src/tests/documents-page.test.tsx` to verify polling reaches terminal `completed` and `failed` states and stops requesting more status updates afterward.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- With Phase 4 complete, the next MVP-critical step is wiring document retrieval into chat.

---

## TASK-016: Build chat UI

Status: done

Owner Agent: Codex
Git Branch: task/TASK-016-build-chat-ui
Commit Hash: 737cd5b
Started: 2026-06-21
Completed: 2026-06-21

### Objective
Create the MVP chat page with session navigation, message history, composer interactions, loading states, tool activity, source context, and empty-state guidance.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/components/chat/ChatComposer.tsx
- src/components/chat/ChatLayout.tsx
- src/components/chat/MessageList.tsx
- src/components/chat/SessionList.tsx
- src/components/chat/SourcePanel.tsx
- src/components/chat/ToolActivityPanel.tsx
- src/tests/chat-layout.test.tsx

### Implementation Notes
- Replaced the static chat scaffold with an interactive client-side workspace that supports session switching, creating a new chat, sending a question, and showing a mock assistant reply with source and tool metadata.
- Added a visible “searching your documents” assistant loading state, preserved empty-chat guidance, and surfaced a simple chat error state for failed mock responses.
- Kept the model and thinking controls read-only per the MVP page spec while making the side panels follow the latest assistant message metadata.

### Tests Added
- `src/tests/chat-layout.test.tsx`
- Existing chat scaffold coverage in `src/tests/page-scaffolds.test.tsx` still passes with the updated UI.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Continue to `TASK-017` to persist chat sessions and messages in Supabase.

---

## TASK-017: Implement chat persistence

Status: done

Owner Agent: Codex
Git Branch: task/TASK-017-chat-persistence
Commit Hash: 7541856
Started: 2026-06-21
Completed: 2026-06-21

### Objective
Persist chat sessions and chat messages in Supabase so the chat page survives refresh and stays scoped to the authenticated user.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/app/(app)/chat/page.tsx
- src/app/api/chat/route.ts
- src/app/api/chat/sessions/route.ts
- src/app/api/chat/sessions/[sessionId]/route.ts
- src/components/chat/ChatLayout.tsx
- src/components/chat/MessageBubble.tsx
- src/components/chat/MessageList.tsx
- src/components/chat/types.ts
- src/lib/validations/chat.ts
- src/server/chat/persistence.ts
- src/tests/chat-layout.test.tsx
- src/tests/chat-route.test.ts
- src/tests/chat-sessions-route.test.ts
- src/tests/page-scaffolds.test.tsx

### Implementation Notes
- Added typed Supabase-backed chat persistence helpers for listing sessions, loading a single session, creating a session on demand, and saving user plus assistant messages together.
- Added authenticated `/api/chat`, `/api/chat/sessions`, and `/api/chat/sessions/:sessionId` routes with Zod validation and user-scoped access.
- Updated the `/chat` page to load saved sessions server-side and submit new messages through the persistence API so chat history survives refresh.
- Preserved the MVP placeholder assistant behavior on the server by storing deterministic assistant replies with source and tool metadata in `chat_messages.metadata`.

### Tests Added
- `src/tests/chat-route.test.ts`
- `src/tests/chat-sessions-route.test.ts`
- Updated `src/tests/chat-layout.test.tsx`
- Updated `src/tests/page-scaffolds.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Continue to `TASK-018` to replace the stored mock assistant reply with real Pinecone-backed retrieval.

---

## TASK-018: Implement vector search tool

Status: done

Owner Agent: Codex
Git Branch: task/TASK-018-vector-search-tool
Commit Hash: 8311e15
Started: 2026-06-21
Completed: 2026-06-21

### Objective
Create a user-scoped vector search tool that embeds the query, searches the authenticated user's Pinecone namespace, and returns retrieved chunk metadata for chat grounding.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/lib/validations/vector-search.ts
- src/server/embeddings/service.ts
- src/server/pinecone/client.ts
- src/server/pinecone/indexing.ts
- src/server/tools/vector-search.ts
- src/tests/vector-search-tool.test.ts

### Implementation Notes
- Added a validated Pinecone vector-search helper that embeds the user query, enforces the authenticated user's namespace, supports optional document-id filtering, and returns chunk-level metadata for grounding.
- Extended the Pinecone client helpers with a typed query client so upsert and query operations share the same index targeting logic.
- Added `agent_tool_calls` logging support for successful and failed vector-search executions when a chat session id is available.
- Exported the resolved embedding configuration helper so query embedding and document embedding stay aligned on provider/model selection.

### Tests Added
- `src/tests/vector-search-tool.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- The retrieval primitive is ready to plug into the upcoming date/time tool and LangGraph chat flow.

---

## TASK-019: Implement date/time tool

Status: done

Owner Agent: Codex
Git Branch: task/TASK-019-date-time-tool
Commit Hash: 19928dd
Started: 2026-06-21
Completed: 2026-06-21

### Objective
Create a deterministic date/time tool that returns the current ISO timestamp, a user-friendly date string, the timezone, and a logged tool-call record.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- src/lib/validations/date-time.ts
- src/server/tools/date-time.ts
- src/tests/date-time-tool.test.ts

### Implementation Notes
- Added a deterministic date/time tool with optional locale/timezone input, injectable clock support for tests, and a normalized payload containing ISO datetime, friendly datetime, and timezone.
- Reused the `agent_tool_calls` logging pattern so successful and failed time lookups are observable when invoked inside a chat session.

### Tests Added
- `src/tests/date-time-tool.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- The next tool step is Tavily-backed web search for current-information questions.

---

## TASK-020: Implement Tavily web search tool

Status: done

Owner Agent: Codex
Git Branch: task/TASK-020-tavily-web-search-tool
Commit Hash: 5ac0cd4
Started: 2026-06-22
Completed: 2026-06-22

### Objective
Create a server-side Tavily web-search tool with validated inputs, normalized results, and logged tool-call records.

### Files Changed
- ENVIRONMENT.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- package-lock.json
- package.json
- src/lib/env.ts
- src/lib/validations/web-search.ts
- src/server/tools/web-search.ts
- src/tests/web-search-tool.test.ts

### Implementation Notes
- Added the Tavily SDK and created a typed server-only web-search helper that validates the query/max-result inputs, applies a timeout, and normalizes the returned snippets for chat metadata usage.
- Reused the `agent_tool_calls` logging pattern so successful and failed Tavily executions are observable without leaking secrets into logs.

### Tests Added
- `src/tests/web-search-tool.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- After validation, move on to the LangGraph agent wiring in `TASK-021`.

---

## TASK-021: Implement LangGraph agent

Status: done

Owner Agent: Codex
Git Branch: task/TASK-022-chat-api-endpoint
Commit Hash: 861397e
Started: 2026-06-22
Completed: 2026-06-22

### Objective
Create a LangGraph-based chat agent that routes between vector retrieval, date/time, and Tavily web search, then composes a grounded answer with LangSmith tracing metadata.

### Files Changed
- ENVIRONMENT.md
- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- design.md
- package-lock.json
- package.json
- src/server/agent/workflow.ts
- src/server/tools/vector-search.ts
- src/tests/agent-workflow.test.ts

### Implementation Notes
- Added a compact LangGraph state graph with explicit route, tool, and answer-composition nodes so the agent stays deterministic and easy to test for MVP behavior.
- Wrapped agent invocation in LangSmith `traceable()` tracing with redacted inputs and a returned run id for downstream chat persistence.
- Reused the existing tool helpers so vector, date/time, and Tavily calls stay user-scoped and continue logging through `agent_tool_calls`.

### Tests Added
- `src/tests/agent-workflow.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Wire the new agent into `/api/chat` in `TASK-022` after validation passes.

---

## TASK-022: Implement `/api/chat`

Status: done

Owner Agent: Codex
Git Branch: task/TASK-022-chat-api-endpoint
Commit Hash: ecf7c37
Started: 2026-06-22
Completed: 2026-06-22

### Objective
Replace the mock chat endpoint with the authenticated LangGraph-backed chat flow, persisting the user message before invocation and the assistant reply afterward.

### Files Changed
- .env.example
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- UI_PAGES.md
- design.md
- src/app/api/chat/route.ts
- src/app/api/documents/route.ts
- src/app/api/settings/route.ts
- src/components/chat/types.ts
- src/components/documents/DocumentsWorkspace.tsx
- src/components/settings/SettingsForm.tsx
- src/components/settings/SettingsPageClient.tsx
- src/lib/env.ts
- src/lib/validations/settings.ts
- src/server/documents/list.ts
- src/server/embeddings/service.ts
- src/server/agent/workflow.ts
- src/server/chat/persistence.ts
- src/server/settings/crypto.ts
- src/server/settings/service.ts
- src/server/tools/vector-search.ts
- src/tests/chat-route.test.ts
- src/tests/agent-workflow.test.ts
- src/tests/document-embeddings.test.ts
- src/tests/documents-page.test.tsx
- src/tests/documents-route.test.ts
- src/tests/page-scaffolds.test.tsx
- src/tests/settings-service.test.ts
- src/tests/vector-search-tool.test.ts
- ENVIRONMENT.md

### Implementation Notes
- Replaced the mock `/api/chat` path with a real authenticated flow that loads prior session history, stores the user message, invokes the LangGraph agent, stores the assistant reply, and returns the updated session plus LangSmith run id.
- Extended chat persistence so assistant rows can store `langsmith_run_id` and surface it back through message metadata without exposing any raw secrets.
- Reopened the task to remove the remaining dummy document-history behavior: the `/documents` workspace now hydrates from authenticated `GET /api/documents` results and resumes polling any in-flight backend ingestion record instead of seeding placeholder rows.
- Added encrypted provider-credential storage and server-only decryption helpers so saved `/settings` embedding keys can drive document ingestion and vector search when `OPENAI_API_KEY` is not present in the environment.
- Prevented legacy metadata-only credentials from appearing as usable masked secrets in `/settings`, so users are prompted to re-enter keys that predate encrypted storage instead of hitting a later ingestion failure.
- Hardened the shared embedding config resolver so unsupported saved embedding providers such as `gemini` still fall back to the MVP server default provider and model without crashing document ingestion or vector search.
- Fixed a regression where the runtime embedding service only supported `openai`, which caused both saved Gemini settings and `DEFAULT_EMBEDDING_PROVIDER=gemini` to collapse back to OpenAI and fail with a missing OpenAI key. The embedding runtime now supports Gemini directly and uses `gemini-embedding-2` as the default model when the default provider is Gemini and no explicit model is set.
- Inspected the live Supabase rows for the failing user and confirmed the remaining Gemini failure was caused by a legacy `default-embedding` credential row that still had only `api_key_last4` metadata but no encrypted secret payload. The settings service and route now surface a clear “re-enter this key in Settings” error instead of letting ingestion fail later with a generic missing-key message.
- Added a Pinecone-dimension-aware embedding settings flow: the settings UI now captures embedding dimensions, the settings API validates that they match `PINECONE_VECTOR_DIMENSION`, and the embedding runtime passes that dimension into OpenAI/Gemini requests while rejecting any returned vector length mismatch before Pinecone upsert.
- Reopened the task to fix a runtime chat regression where saved Gemini chat settings crashed the agent before it could respond, and to make `/api/chat` return JSON error payloads even when the agent fails.
- Added server-side chat-model resolution that accepts saved Gemini settings, uses encrypted user credentials when available, and falls back to the configured default chat provider instead of hard-failing on unsupported saved providers.
- Added a Gemini chat runtime path for the LangGraph answer-composition step so the agent can invoke Gemini models directly without tripping the prior MVP-only OpenAI guard.
- Hardened `/api/chat` request handling so malformed JSON bodies and agent runtime exceptions both return structured JSON responses, which prevents the frontend composer from failing with `Unexpected end of JSON input`.

### Tests Added
- Updated `src/tests/chat-route.test.ts`
- Added regression coverage to `src/tests/document-embeddings.test.ts` and `src/tests/vector-search-tool.test.ts` for unsupported saved embedding providers and saved-key resolution.
- Added `src/tests/documents-route.test.ts` for authenticated document listing.
- Expanded `src/tests/documents-page.test.tsx` and `src/tests/page-scaffolds.test.tsx` so the documents UI loads backend history instead of seed data.
- Added `src/tests/settings-service.test.ts` to verify legacy credentials without encrypted payloads are not presented as reusable saved secrets.
- Extended the embedding and vector-search tests to verify saved Gemini settings resolve to Gemini instead of silently falling back to OpenAI.
- Expanded the settings service and route tests to verify legacy metadata-only credentials produce an explicit re-entry error.
- Expanded settings, embedding, and vector-search tests to cover embedding-dimension persistence, request shaping, and wrong-dimension rejection.
- Expanded `src/tests/agent-workflow.test.ts` to cover saved Gemini chat settings, default-provider fallback, and Gemini invocation.
- Expanded `src/tests/chat-route.test.ts` to cover malformed JSON request bodies and structured error responses when the chat agent throws.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- None

---

## TASK-023: Add LangSmith tracing

Status: done

Owner Agent: Codex
Git Branch: task/TASK-023-langsmith-tracing
Commit Hash:
Started: 2026-06-22
Completed: 2026-06-22

### Objective
Trace agent runs, tool calls, and retrieval behavior with redacted LangSmith payloads while persisting the run id for chat history.

### Files Changed
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- design.md
- src/server/agent/workflow.ts
- src/server/langsmith/tracing.ts
- src/tests/langsmith-tracing.test.ts

### Implementation Notes
- Added `src/server/langsmith/tracing.ts` so all LangSmith tracing uses one server-side helper that returns the real runtime result to the app while emitting only redacted summaries to LangSmith.
- Wrapped the vector-search, date/time, web-search, and answer-composition stages in explicit tool traces so retrieval behavior and tool execution are visible without leaking full prompts, raw document text, or full model outputs.
- Kept the top-level chat-agent trace ID flow intact so `/api/chat` can continue persisting the LangSmith run id alongside assistant messages.

### Tests Added
- `src/tests/langsmith-tracing.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the shared tracing helper for app-level structured event logging in `TASK-024`.

---

## TASK-024: Add app-level event logging

Status: done

Owner Agent: Codex
Git Branch: task/TASK-024-app-event-logging
Commit Hash:
Started: 2026-06-22
Completed: 2026-06-22

### Objective
Log document and chat lifecycle events with consistent structured payloads that are safe for server-side observability.

### Files Changed
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- design.md
- src/app/api/chat/route.ts
- src/app/api/documents/upload/route.ts
- src/server/documents/process.ts
- src/server/logging/events.ts
- src/tests/app-event-logger.test.ts
- src/tests/chat-route.test.ts
- src/tests/document-processing.test.ts
- src/tests/document-upload-route.test.ts

### Implementation Notes
- Added `src/server/logging/events.ts` to emit structured JSON lifecycle events with stable names, timestamps, IDs, counts, durations, and sanitized error messages.
- Logged chat request start/completion/failure in `/api/chat` without storing raw prompts or assistant bodies in the event payload.
- Logged document upload start/completion/failure in `/api/documents/upload` and document processing start/completion/failure in `processUploadedDocument`.

### Tests Added
- `src/tests/app-event-logger.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the structured logger for later smoke-test and deployment instrumentation tasks.

---

## TASK-025: Add server-side auth guards

Status: done

Owner Agent: Codex
Git Branch: task/TASK-025-server-side-auth-guards
Commit Hash: a7290a7
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Ensure all protected APIs enforce auth and derive user identity exclusively from the authenticated server session.

### Files Changed
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- src/app/api/chat/route.ts
- src/app/api/chat/sessions/[sessionId]/route.ts
- src/app/api/chat/sessions/route.ts
- src/app/api/documents/[documentId]/status/route.ts
- src/app/api/documents/route.ts
- src/app/api/documents/upload/route.ts
- src/app/api/settings/route.ts
- src/server/auth/api.ts
- src/tests/chat-route.test.ts
- src/tests/settings-route.test.ts

### Implementation Notes
- Added `src/server/auth/api.ts` so every protected route handler can enforce the same server-side Supabase session check and derive `userId` from the authenticated request context.
- Replaced per-route auth duplication across settings, documents, chat, and chat-session APIs with the shared authenticated route wrapper.
- Added regression coverage proving client-supplied `userId` fields are ignored in favor of the authenticated server session.

### Tests Added
- `src/tests/chat-route.test.ts`
- `src/tests/settings-route.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the authenticated route wrapper for any future protected APIs added during later deployment or MCP phases.

---

## TASK-026: Validate all API inputs with Zod

Status: done

Owner Agent: Codex
Git Branch: task/TASK-026-api-zod-validation
Commit Hash: fbc8d66
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Add explicit Zod-backed validation to every API input boundary so malformed JSON, invalid params, and unsupported upload payloads fail with `400`.

### Files Changed
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- src/app/api/chat/route.ts
- src/app/api/chat/sessions/[sessionId]/route.ts
- src/app/api/documents/[documentId]/status/route.ts
- src/app/api/documents/upload/route.ts
- src/app/api/settings/route.ts
- src/lib/validations/documents.ts
- src/server/documents/upload.ts
- src/server/http/validation.ts
- src/tests/chat-sessions-route.test.ts
- src/tests/document-status-route.test.ts
- src/tests/document-upload-route.test.ts
- src/tests/settings-route.test.ts

### Implementation Notes
- Added `src/server/http/validation.ts` so JSON route handlers can reject malformed JSON and return schema field errors consistently.
- Added `parseUploadDocumentRequest` to validate multipart file presence and metadata with Zod before upload processing begins.
- Moved UUID param parsing to the document-status and chat-session route boundaries so invalid params fail early with `400`.

### Tests Added
- `src/tests/chat-sessions-route.test.ts`
- `src/tests/document-status-route.test.ts`
- `src/tests/document-upload-route.test.ts`
- `src/tests/settings-route.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the shared JSON parser for future protected APIs so new routes inherit the same `400` behavior for malformed payloads.

---

## TASK-027: Add secret handling safeguards

Status: done

Owner Agent: Codex
Git Branch: task/TASK-027-secret-handling-safeguards
Commit Hash: e54c914
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Prevent provider key leakage across API responses, structured logs, and tracing previews while preserving masked credential UX.

### Files Changed
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- src/app/api/settings/route.ts
- src/server/langsmith/tracing.ts
- src/server/logging/events.ts
- src/server/security/redaction.ts
- src/tests/app-event-logger.test.ts
- src/tests/langsmith-tracing.test.ts
- src/tests/settings-route.test.ts

### Implementation Notes
- Added `src/server/security/redaction.ts` to recursively scrub secret-shaped keys and inline credential text such as bearer tokens and API keys.
- Applied shared redaction to structured app-event logging, LangSmith trace previews, and settings API error responses before they can surface raw secret material.
- Kept the existing masked-settings flow intact and extended tests to prove raw secrets never reappear in logs or reflected error payloads.

### Tests Added
- `src/tests/app-event-logger.test.ts`
- `src/tests/langsmith-tracing.test.ts`
- `src/tests/settings-route.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the shared redaction helper anywhere future MCP or deployment features surface secret-adjacent payloads into logs, traces, or user-visible errors.

---

## TASK-028: Add E2E auth test

Status: done

Owner Agent: Codex
Git Branch: task/TASK-028-e2e-auth-test
Commit Hash: 2cc53e6
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Validate login and protected routing with a real Playwright browser flow.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- ENVIRONMENT.md
- TESTING.md
- playwright.config.ts
- src/app/(app)/chat/page.tsx
- src/app/api/e2e/login/route.ts
- src/components/auth/LoginForm.tsx
- src/lib/e2e.ts
- src/server/auth/e2e.ts
- src/server/auth/session.ts
- src/server/supabase/middleware.ts
- src/tests/auth-forms.test.tsx
- src/tests/e2e/auth.spec.ts
- vitest.config.ts

### Implementation Notes
- Added a Playwright-only auth harness that exercises the real login form without requiring seeded Supabase credentials.
- Reused the protected-route middleware and server auth helpers with a test-only cookie so `/chat` and `/settings` can render deterministically during E2E.
- Isolated Vitest from Playwright specs and pinned the Playwright web server to a dedicated local port for stable runs.

### Tests Added
- `src/tests/e2e/auth.spec.ts`
- Updated `src/tests/auth-forms.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the Playwright auth harness for the document, chat, and tool-routing E2E tasks in Phase 9.
- 2026-06-25: Hardened `src/components/auth/LoginForm.tsx` so a stray `/api/e2e/login` `404 Not found` response falls back to normal Supabase auth during local development, while `src/tests/auth-forms.test.tsx` and `src/tests/e2e/auth.spec.ts` continue to validate the intended Playwright bypass path.

---

## TASK-029: Add E2E document upload test

Status: done

Owner Agent: Codex
Git Branch: task/TASK-029-e2e-document-upload-test
Commit Hash: 18a77e7
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Validate TXT or Markdown upload, live processing updates, and completed document visibility in a real browser flow.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- src/tests/e2e/auth.spec.ts
- src/tests/e2e/document-upload.spec.ts
- src/tests/e2e/helpers.ts

### Implementation Notes
- Added a Playwright document-upload flow that logs in through the existing auth harness, uploads a Markdown file, and waits for the mocked ingestion pipeline to reach `completed`.
- Introduced a shared E2E helper for login and settings mocking so the Phase 9 browser suite stays consistent across scenarios.
- Made the mocked document API stateful so dev-mode rerenders do not wipe the uploaded row before the completion assertions run.

### Tests Added
- `src/tests/e2e/document-upload.spec.ts`
- Refined `src/tests/e2e/auth.spec.ts` through shared helpers

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the shared E2E helper for the chat RAG and tool-routing browser tasks.

---

## TASK-030: Add E2E chat RAG test

Status: done

Owner Agent: Codex
Git Branch: task/TASK-030-e2e-chat-rag-test
Commit Hash: 2a914b0
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Validate document-grounded chat in a real browser flow and confirm messages persist after refresh.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- src/app/(app)/chat/page.tsx
- src/app/api/chat/route.ts
- src/app/api/e2e/reset/route.ts
- src/server/auth/api.ts
- src/server/e2e/chat-store.ts
- src/tests/e2e-chat-store.test.ts
- src/tests/e2e/chat-rag.spec.ts
- src/tests/e2e/helpers.ts

### Implementation Notes
- Added a tiny server-side E2E chat store plus reset endpoint so Playwright can validate persisted chat sessions through real `/api/chat` requests and a refreshed server-rendered `/chat` page.
- Extended authenticated API handling to honor the existing Playwright auth bypass for protected route handlers without weakening normal Supabase-backed flows.
- Added a browser test that asks for the known launch-city fact, verifies the grounded answer and retrieval metadata, then confirms the session survives refresh.

### Tests Added
- `src/tests/e2e/chat-rag.spec.ts`
- `src/tests/e2e-chat-store.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

### Result
Pass

### Blockers
- None

### Follow-up
- Reuse the E2E chat store and reset hook for the Phase 9 tool-routing browser task.

---

## TASK-031: Add E2E tool-routing test

Status: done

Owner Agent: Codex
Git Branch: task/TASK-031-e2e-tool-routing-test
Commit Hash: ad29c36
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Validate date, vector-search, and Tavily-style web routing in a real browser flow.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- src/server/e2e/chat-store.ts
- src/tests/e2e-chat-store.test.ts
- src/tests/e2e/tool-routing.spec.ts

### Implementation Notes
- Extended the shared E2E chat store so date prompts emit `date.now`, document prompts emit `pinecone.query`, and current web prompts emit `tavily.search`, each with deterministic answers and metadata.
- Added a Playwright routing spec that starts fresh chats for each route and verifies the correct tool activity appears in the UI.
- Expanded the chat-store unit test coverage so the deterministic E2E routing stays validated outside browser runs too.

### Tests Added
- `src/tests/e2e/tool-routing.spec.ts`
- Expanded `src/tests/e2e-chat-store.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

### Result
Pass

### Blockers
- None

### Follow-up
- Carry the now-complete E2E auth, upload, chat, and tool-routing coverage into the final Phase 9 smoke-check and deployment tasks.

---

## TASK-032: Add production deployment config

Status: done

Owner Agent: Codex
Git Branch: task/TASK-032-production-deployment-config
Commit Hash: 0275674
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Prepare the app for production deployment and confirm the build path is documented and validated.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- ENVIRONMENT.md
- GITHUB.md
- README.md
- TESTING.md
- next.config.ts
- src/app/(app)/chat/page.tsx
- src/app/api/chat/route.ts
- src/app/api/e2e/reset/route.ts
- src/server/auth/e2e.ts
- src/server/e2e/chat-store.ts
- src/tests/e2e/helpers.ts

### Implementation Notes
- Enabled Next.js standalone production output and removed the public `x-powered-by` header so the built app is ready to run as a standalone Node server in production.
- Documented the production startup command and required deployment env handling in `README.md`, `ENVIRONMENT.md`, and `GITHUB.md`.
- Hardened the shared Playwright E2E harness with per-browser state isolation so the required deployment validation suite stays stable under parallel workers while `npm run build` remains green.

### Tests Added
- Reused the existing automated validation stack; no new task-specific test files were required.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
Pass

### Blockers
- None

### Follow-up
- Carry the stable standalone build and parallel-safe E2E harness into the final MVP smoke-check task.

---

## TASK-033: Add MVP smoke test checklist

Status: done

Owner Agent: Codex
Git Branch: task/TASK-033-mvp-smoke-test-checklist
Commit Hash: 1c6baca
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Create the final MVP launch checklist and back it with the current validation evidence.

### Files Changed
- PROGRESS_LOG.md
- README.md
- SMOKE_CHECKLIST.md
- TASKS.md
- TESTING.md

### Implementation Notes
- Started the Phase 9 smoke-checklist task on its own branch.

### Tests Added
- No new test files; this task records the current validation evidence.

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run db:migrate
npm run test:db
```

### Result
Pass

### Blockers
- None

### Follow-up
- Keep `SMOKE_CHECKLIST.md` current whenever future changes alter the MVP launch gate.

---

## TASK-034: Add runtime MCP schema

Status: done

Owner Agent: Codex
Git Branch: task/TASK-034-add-runtime-mcp-schema
Commit Hash: 423833c
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Add database support for configurable runtime MCP servers with secure per-user storage and audit logging.

### Files Changed
- AGENTIC_RAG_MCP.md
- DATABASE_SCHEMA.md
- ENVIRONMENT.md
- MCP_SERVERS.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- design.md
- scripts/apply-supabase-migration.mjs
- src/lib/validations/mcp.ts
- src/server/mcp/redaction.ts
- src/server/security/redaction.ts
- src/tests/database-schema.test.ts
- src/tests/mcp-config.test.ts
- supabase/migrations/0002_runtime_mcp_schema.sql

### Implementation Notes
- Started the Phase 10 runtime MCP schema task on its own branch.
- Added an ordered `0002` migration for runtime MCP tables, constraints, indexes, triggers, and RLS policies.
- Updated the migration runner and database schema test harness to apply all SQL migrations in order.
- Added runtime MCP validation and browser-safe redaction helpers so later APIs can reuse secure response shaping.

### Tests Added
- `src/tests/mcp-config.test.ts`
- Runtime MCP coverage in `src/tests/database-schema.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:db
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Validate secure schema storage, RLS, and browser-safe response shaping before closing the task.

---

## TASK-035: Add runtime MCP backend adapter

Status: done

Owner Agent: Codex
Git Branch: task/TASK-035-add-runtime-mcp-backend-adapter
Commit Hash: 010da8d
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Create a server-only MCP client layer that loads enabled runtime MCP configs and exposes safe tool adapters for later API and agent integration work.

### Files Changed
- AGENTIC_RAG_MCP.md
- ENVIRONMENT.md
- MCP_SERVERS.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- design.md
- src/lib/env.ts
- src/server/mcp/client.ts
- src/server/mcp/registry.ts
- src/server/mcp/tools.ts
- src/tests/mcp-backend-adapter.test.ts

### Implementation Notes
- Started the Phase 10 runtime MCP backend adapter task on its own branch.
- Added a server-only runtime MCP client layer with HTTP and stdio transports, request timeouts, and stdio allowlist enforcement.
- Added a registry that loads enabled MCP configs and normalizes them into runtime transport configs.
- Added LangChain-compatible runtime MCP tool wrappers that redact input/output logs before writing `mcp_tool_invocations`.

### Tests Added
- `src/tests/mcp-backend-adapter.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Keep the adapter server-only and defer actual agent wiring to `TASK-038`.

---

## TASK-036: Add MCP configuration APIs

Status: done

Owner Agent: Codex
Git Branch: task/TASK-036-add-mcp-configuration-apis
Commit Hash: 117a68f
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Add authenticated server APIs for creating, reading, updating, deleting, testing, and previewing runtime MCP server configs without leaking stored secrets.

### Files Changed
- MCP_SERVERS.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- design.md
- src/app/api/mcp/servers/route.ts
- src/app/api/mcp/servers/[serverId]/route.ts
- src/app/api/mcp/servers/[serverId]/test/route.ts
- src/app/api/mcp/servers/[serverId]/tools/route.ts
- src/lib/validations/mcp.ts
- src/server/mcp/service.ts
- src/tests/mcp-routes.test.ts
- src/tests/mcp-service.test.ts

### Implementation Notes
- Started the Phase 10 runtime MCP configuration API task on its own branch.
- Added authenticated MCP server CRUD, test, and tool-preview routes under `/api/mcp/servers`.
- Added a server-side MCP config service that sanitizes returned rows and encrypts stored secret maps.
- Reused the runtime MCP adapter to power test-connection and tools-preview responses.

### Tests Added
- `src/tests/mcp-routes.test.ts`
- `src/tests/mcp-service.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Keep raw MCP secrets server-only and return only sanitized config shapes to the browser.

---

## TASK-037: Add MCP Tools Settings UI

Status: done

Owner Agent: Codex
Git Branch: task/TASK-037-add-mcp-tools-settings-ui
Commit Hash: 0df7d47
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Add a Settings UI for runtime MCP tool configuration with transport-aware forms, test actions, tool previews, and secret-safe editing states.

### Files Changed
- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- UI_MOCKUPS.md
- UI_PAGES.md
- src/components/settings/McpToolsSettings.tsx
- src/components/settings/SettingsPageClient.tsx
- src/tests/mcp-tools-settings.test.tsx

### Implementation Notes
- Started the Phase 10 MCP Tools settings UI task on its own branch.
- Added a tabbed `/settings` experience with the existing model controls under `Models` and the new runtime MCP UI under `MCP Tools`.
- Added an MCP server list, add/edit dialog, transport-aware fields, and test/preview/delete actions.
- Kept stored runtime MCP secrets masked in the browser by relying on sanitized API responses and blank replacement inputs.

### Tests Added
- `src/tests/mcp-tools-settings.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Keep raw stored secrets masked in the UI and defer live agent usage to `TASK-038`.

---

## TASK-038: Integrate runtime MCP tools into Agentic RAG

Status: done

Owner Agent: Codex
Git Branch: task/TASK-038-integrate-runtime-mcp-tools
Commit Hash: 3fff9a2
Started: 2026-06-23
Completed: 2026-06-23

### Objective
Allow the chat assistant to fall back to enabled runtime MCP tools after document retrieval without breaking the existing vector-search-first behavior.

### Files Changed
- AGENTIC_RAG_MCP.md
- PROGRESS_LOG.md
- TASKS.md
- TESTING.md
- design.md
- src/server/agent/workflow.ts
- src/server/mcp/tools.ts
- src/tests/agent-workflow.test.ts
- src/tests/mcp-backend-adapter.test.ts

### Implementation Notes
- Started the Phase 10 runtime MCP integration task on its own branch.
- Added a runtime MCP fallback node to the chat workflow that runs only after low-confidence document retrieval.
- Kept vector search as the first document-grounding step and preserved the existing date/web routing behavior.
- Attached LangSmith run IDs to runtime MCP invocation logs and surfaced MCP fallback sources/tool activity in chat metadata.

### Tests Added
- Runtime MCP fallback coverage in `src/tests/agent-workflow.test.ts`
- LangSmith-linked MCP logging coverage in `src/tests/mcp-backend-adapter.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Keep vector search as the first document-grounding step and use runtime MCP only as a safe fallback path.

---

## TASK-039: Refine protected shell, navigation, spacing, and overflow handling

Status: done

Owner Agent: Codex
Git Branch: task/TASK-039-professional-shell-refresh
Commit Hash: 7947466
Started: 2026-06-25
Completed: 2026-06-25

### Objective
Upgrade the protected app shell and page framing to a professional dashboard standard, and lay down the information architecture required for History and Admin surfaces.

### Files Changed
- TASKS.md
- PROGRESS_LOG.md
- design.md
- UI_MOCKUPS.md
- UI_PAGES.md
- SECURITY.md
- TESTING.md
- ENVIRONMENT.md
- MCP_SERVERS.md
- AGENTIC_RAG_MCP.md
- src/app/(app)/admin/page.tsx
- src/app/(app)/chat/page.tsx
- src/app/(app)/documents/page.tsx
- src/app/(app)/history/page.tsx
- src/app/(app)/layout.tsx
- src/app/(app)/settings/page.tsx
- src/components/app-shell/AppShell.tsx
- src/components/app-shell/navigation.ts
- src/components/app-shell/PageHeader.tsx
- src/components/app-shell/ProtectedPagePlaceholder.tsx
- src/components/app-shell/TopNav.tsx
- src/components/chat/ChatLayout.tsx
- src/server/auth/authorization.ts
- src/server/supabase/middleware.ts
- src/tests/app-shell.test.tsx
- src/tests/page-scaffolds.test.tsx
- src/tests/supabase-auth.test.tsx

### Implementation Notes
- Appended the multi-phase implementation plan into the project markdown files before starting product code changes.
- Added the new task series `TASK-039` through `TASK-048` so the remaining work is tracked in-repo.
- Reworked the protected shell with a taller sticky top bar, consistent max-width framing, a dedicated inner scroll region, and shared page headers for the refreshed app surfaces.
- Added `History` routing, admin-aware navigation, protected-route middleware coverage for the expanded IA, and placeholder pages for `/history` and `/admin`.
- Updated the chat, documents, and settings pages to share the new framing while preserving the existing product behavior underneath.

### Tests Added
- Protected shell navigation and admin-role coverage in `src/tests/app-shell.test.tsx`
- Protected page placeholder coverage in `src/tests/page-scaffolds.test.tsx`
- Expanded middleware/layout auth coverage for `/history` and admin navigation in `src/tests/supabase-auth.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Implement the protected shell refresh first, then continue through logout, chat modernization, history, documents, and admin tasks in sequence.

---

## TASK-040: Implement working logout flow and authenticated session controls

Status: done

Owner Agent: Codex
Git Branch: task/TASK-040-logout-session-controls
Commit Hash: d1371d0
Started: 2026-06-25
Completed: 2026-06-25

### Objective
Replace the placeholder logout control with a working authenticated sign-out flow across both Supabase sessions and the E2E auth bypass.

### Files Changed
- TASKS.md
- PROGRESS_LOG.md
- src/app/api/auth/logout/route.ts
- src/components/app-shell/UserMenu.tsx
- src/tests/app-shell.test.tsx
- src/tests/e2e/auth.spec.ts
- src/tests/logout-route.test.ts
- src/tests/supabase-auth.test.tsx
- src/tests/user-menu.test.tsx

### Implementation Notes
- Started the dedicated logout task branch after completing and pushing TASK-039.
- Added a server-side logout route that signs out Supabase sessions, safely clears the E2E bypass cookie, and returns a browser-safe redirect target.
- Replaced the shell placeholder button with an authenticated logout flow that calls the new route, clears the browser Supabase session, and redirects users back to `/login`.
- Extended the auth E2E scenario so the bypass cookie is proven to clear before a second visit to `/settings`.

### Tests Added
- Logout route coverage in `src/tests/logout-route.test.ts`
- User menu logout behavior coverage in `src/tests/user-menu.test.tsx`
- Updated shell and auth regression coverage in `src/tests/app-shell.test.tsx`, `src/tests/supabase-auth.test.tsx`, and `src/tests/e2e/auth.spec.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Add the server logout route first, then wire the shell control and E2E-safe redirect flow.

---

## TASK-041: Add chat model selection, thinking controls, and saved preference APIs

Status: done

Owner Agent: Codex
Git Branch: task/TASK-041-chat-model-thinking-controls
Commit Hash: d1f8e53
Started: 2026-06-25
Completed: 2026-06-25

### Objective
Expose the authenticated user's chat model options and thinking-level controls in the chat UI, then persist the chosen model metadata with chat sessions and messages.

### Files Changed
- TASKS.md
- PROGRESS_LOG.md
- src/app/api/chat/models/route.ts
- src/app/api/chat/route.ts
- src/components/chat/ChatLayout.tsx
- src/components/chat/types.ts
- src/lib/validations/chat.ts
- src/server/agent/workflow.ts
- src/server/chat/models.ts
- src/server/chat/persistence.ts
- src/server/e2e/chat-store.ts
- src/server/settings/service.ts
- src/tests/agent-workflow.test.ts
- src/tests/chat-layout.test.tsx
- src/tests/chat-models-route.test.ts
- src/tests/chat-route.test.ts
- src/tests/page-scaffolds.test.tsx

### Implementation Notes
- Started the model-selection task after completing and pushing TASK-040.
- Added `GET /api/chat/models` plus a server-side selection resolver that returns authenticated chat model options, default thinking preferences, and a safe server-default fallback when no saved chat config exists.
- Threaded the chosen chat model and thinking level through the chat API, persistence layer, and E2E fixture store so sessions and messages retain the selected model metadata.
- Updated the chat UI to load model options, let users choose model and thinking level before sending, and restore those controls from the active session.
- Applied thinking-level guidance inside the agent system prompt while continuing to respect the selected chat provider and model at invocation time.

### Tests Added
- Chat model route coverage in `src/tests/chat-models-route.test.ts`
- Chat model and thinking control coverage in `src/tests/chat-layout.test.tsx`
- Expanded chat API and agent workflow coverage in `src/tests/chat-route.test.ts` and `src/tests/agent-workflow.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Add the model-list API and selection resolver first, then thread the chosen model and thinking level through the chat route and UI.

---

## TASK-042: Convert chat transport and UI to streaming responses

Status: done

Owner Agent: Codex
Git Branch: task/TASK-042-streaming-chat-responses
Commit Hash: 59ed3b4
Started: 2026-06-25
Completed: 2026-06-25

### Objective
Move the chat experience from one-shot JSON replies to streamed assistant output while preserving optimistic UI behavior, persistence, and trace metadata.

### Files Changed
- TASKS.md
- PROGRESS_LOG.md
- src/app/api/chat/route.ts
- src/components/chat/ChatLayout.tsx
- src/tests/chat-layout.test.tsx
- src/tests/chat-stream-route.test.ts

### Implementation Notes
- Added an SSE transport on `POST /api/chat` that emits metadata, assistant deltas, and a final persisted-session event while keeping the JSON fallback for non-stream callers.
- Switched the chat UI to optimistic local session updates plus streamed assistant rendering, then replaced the temporary turn with the persisted session when the stream completed.
- Surfaced LangSmith trace ids during the active turn and kept persistence/logging on the server-side completion path.

### Tests Added
- Streaming route coverage in `src/tests/chat-stream-route.test.ts`
- Updated streaming and optimistic chat UI coverage in `src/tests/chat-layout.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Use the new SSE transport as the baseline for the upcoming history surface so in-flight metadata and final persisted turns stay aligned.

---

## TASK-043: Build LangSmith-aware user history page and history APIs

Status: done

Owner Agent: Codex
Git Branch: task/TASK-043-history-page
Commit Hash: eb441d0
Started: 2026-06-25
Completed: 2026-06-25

### Objective
Add a user-facing history surface backed by application audit data and LangSmith-linked run metadata.

### Files Changed
- ENVIRONMENT.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- UI_PAGES.md
- design.md
- src/app/(app)/history/page.tsx
- src/app/api/history/[sessionId]/route.ts
- src/app/api/history/route.ts
- src/components/history/HistoryFilters.tsx
- src/components/history/HistoryPageClient.tsx
- src/components/history/RunHistoryDetail.tsx
- src/components/history/RunHistoryList.tsx
- src/components/history/types.ts
- src/server/history/service.ts
- src/tests/history-page.test.tsx
- src/tests/history-route.test.ts
- src/tests/page-scaffolds.test.tsx

### Implementation Notes
- Started TASK-043 from the current post-streaming chat baseline on branch `task/TASK-043-history-page`.
- Added a user-scoped history aggregation service over `chat_sessions`, `chat_messages`, `agent_tool_calls`, and `mcp_tool_invocations`, then exposed it through `GET /api/history` and `GET /api/history/:sessionId`.
- Replaced the `/history` placeholder with a filterable audit workspace that loads list/detail data, surfaces built-in and runtime MCP tool activity, and keeps LangSmith run ids as safe browser-visible metadata only.
- Updated the product, UI, security, testing, and environment docs to reflect the new history APIs and page behavior.
- Task commit created: `eb441d0`

### Tests Added
- `src/tests/history-route.test.ts`
- `src/tests/history-page.test.tsx`
- Expanded `src/tests/page-scaffolds.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Build the history data service and authenticated APIs first, then connect the `/history` page UI to the new server data.

---

## TASK-044: Rebuild documents list and add document detail explorer with presigned access links

Status: done

Owner Agent: Codex
Git Branch: task/TASK-044-document-explorer
Started: 2026-06-25
Completed: 2026-06-25
Commit Hash: ca8fdb6

### Objective
Turn the documents area into a clearer two-level explorer for uploaded files, chunks, embeddings, and private access actions.

### Files Changed
- ENVIRONMENT.md
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- UI_MOCKUPS.md
- UI_PAGES.md
- design.md
- package-lock.json
- package.json
- src/app/(app)/documents/[documentId]/page.tsx
- src/app/api/documents/[documentId]/access-link/route.ts
- src/app/api/documents/[documentId]/chunks/route.ts
- src/app/api/documents/[documentId]/embeddings/route.ts
- src/app/api/documents/[documentId]/route.ts
- src/components/documents/DocumentChunksTable.tsx
- src/components/documents/DocumentDetailPage.tsx
- src/components/documents/DocumentEmbeddingPanel.tsx
- src/components/documents/DocumentTable.tsx
- src/components/documents/DocumentsWorkspace.tsx
- src/components/documents/types.ts
- src/lib/validations/documents.ts
- src/server/documents/chunking.ts
- src/server/documents/detail.ts
- src/server/documents/list.ts
- src/server/embeddings/service.ts
- src/server/pinecone/indexing.ts
- src/server/s3/client.ts
- src/tests/document-access-link-route.test.ts
- src/tests/document-chunking.test.ts
- src/tests/document-detail-page.test.tsx
- src/tests/document-detail-route.test.ts
- src/tests/document-embeddings.test.ts
- src/tests/documents-page.test.tsx
- src/tests/documents-route.test.ts
- src/tests/pinecone-indexing.test.ts
- supabase/migrations/0003_document_explorer_metadata.sql

### Implementation Notes
- Started from the post-history baseline on branch `task/TASK-044-document-explorer`.
- Rebuilt the `/documents` workspace into an upload-plus-explorer surface with summary counters, filters, row-level private access actions, and links into a dedicated `/documents/:documentId` detail page.
- Added authenticated document explorer APIs for detail, chunk previews, embedding/index summaries, and ownership-scoped short-lived S3 access links.
- Extended document persistence with chunking and indexing snapshots while reusing the existing embedding snapshot field for richer detail-page metadata.
- Added `@aws-sdk/s3-request-presigner` and hardened `npm run build` to clear stale `.next` artifacts before building after validation exposed intermittent Next.js artifact conflicts.
- Task commit created: `ca8fdb6`

### Tests Added
- `src/tests/document-access-link-route.test.ts`
- `src/tests/document-detail-page.test.tsx`
- `src/tests/document-detail-route.test.ts`
- Expanded `src/tests/document-chunking.test.ts`
- Expanded `src/tests/document-embeddings.test.ts`
- Expanded `src/tests/documents-page.test.tsx`
- Expanded `src/tests/documents-route.test.ts`
- Expanded `src/tests/pinecone-indexing.test.ts`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Continue on a fresh `TASK-045` branch after confirming this branch is pushed and clean.

---

## TASK-045: Add admin role model and admin-only route/API guards

Status: done

Owner Agent: Codex
Git Branch: task/TASK-045-admin-guards
Started: 2026-06-25
Completed: 2026-06-25
Commit Hash: c546815

### Objective
Introduce a simple admin role and enforce it consistently across admin pages and admin-only APIs.

### Files Changed
- PROGRESS_LOG.md
- SECURITY.md
- TASKS.md
- TESTING.md
- UI_PAGES.md
- design.md
- middleware.ts
- src/app/(app)/admin/page.tsx
- src/app/(app)/layout.tsx
- src/app/api/admin/access/route.ts
- src/server/auth/api.ts
- src/server/auth/authorization.ts
- src/tests/admin-guards.test.tsx
- src/tests/page-scaffolds.test.tsx
- src/tests/supabase-auth.test.tsx
- supabase/migrations/0004_admin_profiles.sql

### Implementation Notes
- Started from the completed `TASK-044` baseline on branch `task/TASK-045-admin-guards`.
- Added `profiles.is_admin` through a dedicated migration and introduced shared admin access helpers for server-rendered pages and API routes.
- Protected the `/admin` page before render, added a minimal admin-only API probe at `/api/admin/access`, and updated the protected app layout to read admin state from the shared authorization helper.
- Extended middleware coverage to include `/admin` and `/history`, while keeping document and upload routes user-scoped so admins still cannot read another user's private document content.
- Task commit created: `c546815`

### Tests Added
- `src/tests/admin-guards.test.tsx`
- Expanded `src/tests/page-scaffolds.test.tsx`
- Expanded `src/tests/supabase-auth.test.tsx`

### Validation Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

### Result
- Pass

### Blockers
- None

### Follow-up
- Continue on a fresh `TASK-046` branch after confirming this branch is pushed and clean.
