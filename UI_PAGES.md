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

# `/`

## Route files

- `src/app/page.tsx`

## Functional requirements

- Replace scaffold/task language with user-facing marketing copy.
- Explain the product outcome, problem, solution, benefits, and workflow.
- Include real application snapshots from the product experience with meaningful alt text.
- Surface login and registration CTAs in both the header and hero.
- Include privacy/trust messaging that matches the document-intelligence use case.
- Include a footer with product, navigation, and authentication links.

## Test requirements

- Renders the new marketing sections and CTAs.
- Footer links render correctly.
- Snapshot images include useful alt text.

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
- Center the logo and product name above the heading inside the auth card.
- Keep the page copy to one heading and one description block.
- Render the secondary auth link inside the centered card footer instead of the form body.
- Use `Enter your email` as the email placeholder copy.

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
- Match the centered brand, copy, and footer-link treatment from `/login`.

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
- `src/components/workspace/WorkspaceLayout.tsx`
- `src/components/workspace/icons.tsx`

## Functional requirements

- Load user's chat sessions.
- Create a new session when needed.
- Submit message to `/api/chat`.
- Render the page inside the shared split-workspace primitive without a standalone hero header card.
- Keep the composer pinned to the bottom of the center pane instead of leaving it in the normal document flow.
- Render model and thinking controls inside the composer zone.
- Render user and assistant messages.
- Show tool activity returned in metadata.
- Show structured citation metadata returned in assistant metadata.
- Stream normalized `reasoning` events alongside metadata and content events.
- Persist messages after refresh.

Phase 1A scaffold note:

- The page scaffold may use placeholder sessions, messages, sources, and tool activity while preserving the intended layout and composer interactions.

## Test requirements

- Empty state renders.
- Message submit calls API.
- Empty message submit is blocked.
- Assistant message renders.
- Tool activity panel renders when metadata exists.
- Desktop rail collapse and mobile drawer controls remain accessible through the shared workspace layout.
- Structured citations render as chunk-aware links.
- Reasoning events accumulate safely in the right rail timeline.

---

# `/documents`

## Route files

- `src/app/(app)/documents/page.tsx`
- `src/components/documents/DocumentDropzone.tsx`
- `src/components/documents/ProcessingTimeline.tsx`
- `src/components/documents/DocumentTable.tsx`
- `src/components/documents/DocumentStatusBadge.tsx`
- `src/components/documents/UploadProgressCard.tsx`
- `src/components/workspace/WorkspaceLayout.tsx`
- `src/components/workspace/icons.tsx`

## Functional requirements

- List current user's documents.
- Upload files through `/api/documents/upload`.
- Trigger processing through `/api/documents/:id/process`.
- Hydrate the document history from `GET /api/documents` on initial load instead of seed data.
- Poll `/api/documents/:id/status` every 1–2 seconds while processing.
- Stop polling on `completed` or `failed`.
- Show total and processed chunk counts.
- Render the page inside the shared split-workspace primitive without a standalone hero header card.

Phase 1A scaffold note:

- Before ingestion APIs are implemented, use client-side file-type validation and placeholder progress/history data only.

TASK-009 implementation note:

- The page now includes a local upload-progress simulation for supported files, terminal success/failure states, and a realistic document history table while `TASK-010` prepares the real upload API and storage flow.

## Test requirements

- Dropzone validates supported file types.
- Upload progress appears.
- Processing timeline renders all stages.
- Polling stops on terminal states.
- Failed state displays error.
- Desktop rail collapse and mobile drawer controls remain accessible through the shared workspace layout.
- Document detail chunk rows expose stable anchors and highlight the requested chunk when a `#chunk-{n}` hash is present.

---

# `/settings`

## Route files

- `src/app/(app)/settings/page.tsx`
- `src/components/settings/SettingsForm.tsx`
- `src/components/settings/McpToolsSettings.tsx`
- `src/components/settings/ProviderSelect.tsx`
- `src/components/settings/SecretInput.tsx`
- `src/components/settings/SaveBar.tsx`

## Functional requirements

- Fetch masked settings from `/api/settings`.
- Save settings to `/api/settings`.
- Show a tabbed settings surface with `Models` and `MCP Tools`.
- Fetch runtime MCP server configs from `/api/mcp/servers`.
- Save MCP server configs through `/api/mcp/servers` and `/api/mcp/servers/:id`.
- Test and preview MCP tools through `/api/mcp/servers/:id/test` and `/api/mcp/servers/:id/tools`.
- Validate provider and model names.
- Validate that embedding dimensions are present and match the server Pinecone index dimension.
- Render HTTP-only MCP fields for HTTP configs and stdio-only MCP fields for stdio configs.
- Never display raw stored API keys.
- Never display raw stored MCP headers or env secrets.
- Show save success/error state.

MVP note:

- Keep saved secrets masked after save and encrypted server-side for later model calls.
- Allow provider and model editing without rendering raw stored API keys.

## Test requirements

- Renders chat and embedding sections.
- Renders embedding dimension control.
- Shows masked key placeholder.
- Renders the MCP Tools empty state.
- Renders transport-specific MCP fields when switching transport.
- Calls the MCP save and test APIs from the UI.
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

---

# `/history`

## Route files

- `src/app/(app)/history/page.tsx`
- `src/components/history/HistoryPageClient.tsx`
- `src/components/history/HistoryFilters.tsx`
- `src/components/history/RunHistoryList.tsx`
- `src/components/history/RunHistoryDetail.tsx`

## Functional requirements

- Load only the authenticated user's history.
- Show chat session, prompt, assistant reply, tool activity, runtime MCP activity, and LangSmith run identifiers.
- Load session summaries from `GET /api/history` and selected session detail from `GET /api/history/:sessionId`.
- Keep filtering client-side so users can refine the currently loaded audit list without exposing additional server-side query surfaces yet.
- Support empty, loading, and error states.
- Allow safe server-side LangSmith enrichment without exposing LangSmith credentials.

## Test requirements

- History page renders empty and populated states.
- User cannot load another user's history.
- MCP and built-in tool activity are rendered when present.

---

# `/documents/:documentId`

## Route files

- `src/app/(app)/documents/[documentId]/page.tsx`
- `src/components/documents/DocumentDetailPage.tsx`
- `src/components/documents/DocumentChunksTable.tsx`
- `src/components/documents/DocumentEmbeddingPanel.tsx`

## Functional requirements

- Load only the authenticated user's document.
- Show document metadata, processing status, chunk count, chunking strategy, embedding model snapshot, and vector/index metadata.
- List chunk previews, token counts, and vector IDs.
- Provide user-owned private access actions through server-generated presigned links.

## Test requirements

- Detail page renders loading, not-found, failed, and completed states.
- Chunk and embedding details render for completed documents.
- Presigned access endpoint is ownership-scoped.

---

# `/chat` refinement requirements

## Additional functional requirements

- Load available user chat model configs from `GET /api/chat/models`.
- Allow the user to select thinking level before sending a message.
- Stream assistant responses from `POST /api/chat`.
- Persist selected thinking level and model metadata with the session/message state.

## Additional test requirements

- Chat model and thinking controls render correctly.
- Streaming assistant content renders progressively.
- Tool activity remains visible during and after stream completion.

---

# `/documents` refinement requirements

## Additional functional requirements

- Present a cleaner uploaded-document index with filters and action affordances.
- Link each row to `/documents/:documentId`.
- Show private `View` and `Download` actions backed by server-generated presigned links.
- Surface document-level embedding/index state in the list where available.
- Keep the existing upload dropzone and live pipeline cards visible so ingestion and exploration happen in the same workspace.

## Additional test requirements

- Document index renders filters and actions.
- List rows navigate to the document detail page.
- Private access actions do not appear for unauthorized users.

---

# `/settings` refinement requirements

## Additional functional requirements

- Reframe runtime MCP as user BYO MCP configuration.
- Preserve the existing model and MCP configuration flows under a cleaner information hierarchy.
- Keep all secret values masked after save and reload.

## Additional test requirements

- Settings page renders the BYO MCP framing without leaking secrets.
- Existing MCP flows continue to work after layout refresh.

---

# `/admin`

## Route files

- `src/app/(app)/admin/page.tsx`
- `src/components/admin/AdminPageClient.tsx`
- `src/components/admin/SystemPromptEditor.tsx`
- `src/components/admin/ToolPolicyPanel.tsx`
- `src/components/admin/GlobalMcpSettings.tsx`

## Functional requirements

- Gate the route to admins only.
- Manage one shared assistant system prompt.
- Manage built-in tool policy.
- Manage global MCP server definitions separately from user BYO MCP settings.
- Show operational summaries without exposing user document contents.

## Test requirements

- Non-admin users are denied access.
- Admin config loads and saves successfully.
- Chat workflow respects the saved shared system prompt and built-in tool policy.
- Global MCP admin APIs and UI remain separate from the user `/settings` MCP surface.
- Global MCP settings remain secret-safe in the browser.

Visual QA note:

- Record route-level verification for the refined `/chat`, `/documents`, `/history`, `/settings`, and `/admin` surfaces in `SMOKE_CHECKLIST.md` when the final IA hardening task runs.
