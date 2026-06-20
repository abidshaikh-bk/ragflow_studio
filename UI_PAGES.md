# UI_PAGES.md — Page-Level Implementation Specs

This file translates `UI_MOCKUPS.md` into implementation-ready page specs for Codex agents.

## Shared implementation rules

- Use Next.js App Router.
- Use server components by default.
- Add `'use client'` only for forms, polling, uploads, chat composer, menus, and interactive state.
- Keep page files thin; move UI into `src/components/**`.
- Every page must include loading and error states where relevant.
- Every UI task must include at least one rendering test.
- Use semantic HTML before custom div-only layouts.

---

# `/login`

## Route files

- `src/app/(auth)/login/page.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/AuthCard.tsx`
- `src/components/auth/NetworkBackground.tsx`

## Functional requirements

- Redirect authenticated user to `/chat`.
- Submit credentials to Supabase Auth.
- Show Supabase auth errors.
- Show loading state while submitting.
- Link to `/register`.

Phase 1A scaffold note:

- Until Supabase wiring lands in Phase 2, use local-only submit handling that preserves the target UI states without making network calls.

## Test requirements

- Renders email and password fields.
- Blocks empty submit.
- Shows loading state.
- Calls auth submit handler.

---

# `/register`

## Route files

- `src/app/(auth)/register/page.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/AuthCard.tsx`

## Functional requirements

- Redirect authenticated user to `/chat`.
- Validate email, password, and confirm password.
- Show password mismatch error before calling Supabase.
- Link to `/login`.

Phase 1A scaffold note:

- Use local-only form validation and success/error placeholders until server auth is connected.

## Test requirements

- Renders all fields.
- Shows password mismatch error.
- Calls signup handler with valid fields.

---

# Protected app shell

## Route files

- `src/app/(app)/layout.tsx`
- `src/components/app-shell/AppShell.tsx`
- `src/components/app-shell/TopNav.tsx`
- `src/components/app-shell/UserMenu.tsx`

## Functional requirements

- Require authenticated session.
- Display top navigation.
- Highlight active nav item.
- Provide logout action.
- Wrap all protected pages.

## Test requirements

- Renders nav links.
- Highlights active route.
- Shows logout control.

---

# `/chat`

## Route files

- `src/app/(app)/chat/page.tsx`
- `src/components/chat/ChatLayout.tsx`
- `src/components/chat/SessionList.tsx`
- `src/components/chat/MessageList.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/ChatComposer.tsx`
- `src/components/chat/ToolActivityPanel.tsx`
- `src/components/chat/SourcePanel.tsx`

## Functional requirements

- Load user's chat sessions.
- Create a new session when needed.
- Submit message to `/api/chat`.
- Render user and assistant messages.
- Show tool activity returned in metadata.
- Show source metadata returned in metadata.
- Persist messages after refresh.

Phase 1A scaffold note:

- The page scaffold may use placeholder sessions, messages, sources, and tool activity while preserving the intended layout and composer interactions.

## Test requirements

- Empty state renders.
- Message submit calls API.
- Empty message submit is blocked.
- Assistant message renders.
- Tool activity panel renders when metadata exists.

---

# `/documents`

## Route files

- `src/app/(app)/documents/page.tsx`
- `src/components/documents/DocumentDropzone.tsx`
- `src/components/documents/ProcessingTimeline.tsx`
- `src/components/documents/DocumentTable.tsx`
- `src/components/documents/DocumentStatusBadge.tsx`
- `src/components/documents/UploadProgressCard.tsx`

## Functional requirements

- List current user's documents.
- Upload files through `/api/documents/upload`.
- Trigger processing through `/api/documents/:id/process`.
- Poll `/api/documents/:id/status` every 1–2 seconds while processing.
- Stop polling on `completed` or `failed`.
- Show total and processed chunk counts.

Phase 1A scaffold note:

- Before ingestion APIs are implemented, use client-side file-type validation and placeholder progress/history data only.

## Test requirements

- Dropzone validates supported file types.
- Upload progress appears.
- Processing timeline renders all stages.
- Polling stops on terminal states.
- Failed state displays error.

---

# `/settings`

## Route files

- `src/app/(app)/settings/page.tsx`
- `src/components/settings/SettingsForm.tsx`
- `src/components/settings/ProviderSelect.tsx`
- `src/components/settings/SecretInput.tsx`
- `src/components/settings/SaveBar.tsx`

## Functional requirements

- Fetch masked settings from `/api/settings`.
- Save settings to `/api/settings`.
- Validate provider and model names.
- Never display raw stored API keys.
- Show save success/error state.

MVP note:

- Keep saved secrets masked after save.
- Allow provider and model editing without rendering raw stored API keys.

## Test requirements

- Renders chat and embedding sections.
- Shows masked key placeholder.
- Save button disabled while submitting.
- Validation errors render.
- Raw API key is not rendered after save.

---

# Shared UI components

## Required files

- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Progress.tsx`
- `src/components/ui/Spinner.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ErrorAlert.tsx`
- `src/components/ui/Toast.tsx`

## Test requirements

- Each primitive renders children/labels correctly.
- Disabled states are accessible.
- Focus styles are present.

# MVP-first UI page policy

## MVP page priority

Build these pages first:

1. `/login`
2. `/register`
3. `/documents`
4. `/chat`

Build `/settings` as a minimal read-only configuration status page during MVP. Advanced editable configuration is a later phase.

## `/chat` MVP behavior

The MVP chat page must support:

- starting a new chat,
- selecting an existing chat session,
- sending a question,
- showing assistant answers,
- showing a simple “searching your documents” state,
- persisting messages,
- restricting retrieval to the authenticated user's Pinecone namespace.

The model picker and thinking selector may be visually stubbed but must not block the MVP. Show the default server model as read-only until Phase 3.

## `/documents` MVP behavior

The MVP documents page must support:

- uploading TXT and Markdown files,
- showing upload status,
- showing processing stages,
- showing completed/failed state,
- listing uploaded documents,
- enabling chat once at least one document is completed.

## `/settings` later-phase additions

After MVP smoke tests pass, add tabs:

- Model providers
- Embedding providers
- Credentials
- Runtime MCP tools

## Runtime MCP Tools UI

The MCP Tools tab belongs to Phase 4 and must include:

- transport selector: `stdio` or `http`,
- HTTP URL input,
- stdio command and args input,
- encrypted env/header secret inputs,
- enabled toggle,
- test connection button,
- available tools preview,
- delete/disable controls.

Do not expose raw MCP headers, env values, or decrypted secrets in the browser.
