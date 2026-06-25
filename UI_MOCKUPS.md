# UI_MOCKUPS.md — RAGFlow Studio Page Mockups

This file defines low-fidelity page mockups for Codex/coding agents. Implement these as responsive Next.js pages using Tailwind CSS and the design tokens in `design.md`.

## Global visual language

- Dark SaaS dashboard with a glowing graph/network aesthetic.
- Background: Black Pearl `#050816`.
- Primary action: Violet `#7C3AED`.
- Secondary/highlight: Aqua `#06B6D4`.
- Positive/completed state: Emerald `#10B981`.
- Error/destructive state: Magenta `#D946EF` or red fallback.
- Text: Ice White `#F9FAFB` with muted slate text for secondary labels.
- Headings: Sora.
- Body: Inter.
- Code/technical IDs: JetBrains Mono.
- Use subtle radial glows, thin borders, glass panels, and graph-node accents.

---

# 1. Login page — `/login`

## Layout intent

Public auth page with a centered glass card and a subtle animated/blurred network background.

## Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   RAGFlow Studio                         Minimal nav/logo     │
│                                                              │
│                                                              │
│        ✦ glowing network background / dark gradient ✦         │
│                                                              │
│                 ┌────────────────────────────┐               │
│                 │ RAGFlow Studio             │               │
│                 │ Welcome back               │               │
│                 │                            │               │
│                 │ Email                      │               │
│                 │ [______________________]   │               │
│                 │ Password                   │               │
│                 │ [______________________]   │               │
│                 │                            │               │
│                 │ [ Log in ]                 │               │
│                 │                            │               │
│                 │ New here? Create account   │               │
│                 └────────────────────────────┘               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Required UI states

- Empty fields.
- Invalid email.
- Wrong credentials.
- Loading during submit.
- Success redirect state.

## Components

- `AuthCard`
- `TextInput`
- `PasswordInput`
- `PrimaryButton`
- `FormError`
- `NetworkBackground`

---

# 2. Register page — `/register`

## Layout intent

Same layout as login with registration-specific copy and confirm password.

## Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   RAGFlow Studio                                             │
│                                                              │
│                 ┌────────────────────────────┐               │
│                 │ Create your workspace      │               │
│                 │ Start querying documents   │               │
│                 │                            │               │
│                 │ Email                      │               │
│                 │ [______________________]   │               │
│                 │ Password                   │               │
│                 │ [______________________]   │               │
│                 │ Confirm password           │               │
│                 │ [______________________]   │               │
│                 │                            │               │
│                 │ [ Create account ]         │               │
│                 │                            │               │
│                 │ Already have an account?   │               │
│                 └────────────────────────────┘               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Required UI states

- Password mismatch.
- Weak password if Supabase returns a password policy error.
- Existing account error.
- Email confirmation notice if enabled.

---

# 3. Authenticated app shell

## Layout intent

All protected pages share a dark dashboard shell with a fixed/compact sidebar or top nav. For one-day MVP, top nav is faster.

## Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ RAGFlow Studio   Chat   Documents   Settings        User ▾   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Page content area                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Required behavior

- Current route is visually active.
- Unauthenticated users are redirected to `/login`.
- Logout is available from user menu or button.
- Shell must be keyboard accessible.

---

# 4. Chat page — `/chat`

## Layout intent

A split-pane agent chat UI. Left side has sessions and context status. Main area has messages. Right panel can show sources/tool activity when available.

## MVP wireframe

```txt
┌───────────────────────────────────────────────────────────────────────────┐
│ RAGFlow Studio   Chat   Documents   Settings                    User ▾    │
├───────────────┬───────────────────────────────────────┬───────────────────┤
│ Sessions      │ Agentic RAG Chat                      │ Context           │
│               │                                       │                   │
│ + New chat    │ ┌───────────────────────────────────┐ │ Indexed docs: 4   │
│               │ │ user: What does the policy say?   │ │ Tools available:  │
│ Recent        │ └───────────────────────────────────┘ │ - Vector search   │
│ - Onboarding  │ ┌───────────────────────────────────┐ │ - Date/time       │
│ - Contracts   │ │ assistant: Based on your docs...  │ │ - Web search      │
│               │ │ Sources: doc.pdf chunk 3          │ │                   │
│               │ └───────────────────────────────────┘ │ Last tool calls   │
│               │                                       │ - pinecone.query  │
│               │ [ Ask your documents...        ][↑]   │ - tavily.search   │
└───────────────┴───────────────────────────────────────┴───────────────────┘
```

## Mobile wireframe

```txt
┌──────────────────────────────┐
│ RAGFlow Studio        Menu   │
├──────────────────────────────┤
│ Agentic RAG Chat             │
│                              │
│ [messages...]                │
│                              │
│ Sources / tools collapsible  │
│ [ Ask your docs...     ][↑]  │
└──────────────────────────────┘
```

## Required UI states

- Empty chat.
- User message pending.
- Assistant loading/streaming.
- Tool activity visible.
- Retrieval sources visible.
- Chat error state.
- No indexed documents warning.

## Components

- `ChatLayout`
- `SessionList`
- `MessageBubble`
- `ChatComposer`
- `ToolActivityPanel`
- `SourcePanel`
- `EmptyChatState`

---

# 5. Documents page — `/documents`

## Layout intent

A document ingestion dashboard with upload dropzone, live progress, and document history.

Refinement note:

- The index view now includes summary counters, a file-name filter, a status filter, and row-level `View` / `Download` actions for private files.
- Each document row links into a dedicated explorer page that shows metadata, chunk previews, and vector details.

## Wireframe

```txt
┌──────────────────────────────────────────────────────────────────────┐
│ RAGFlow Studio   Chat   Documents   Settings                User ▾   │
├──────────────────────────────────────────────────────────────────────┤
│ Documents                                                            │
│ Upload, process, and index documents into your vector knowledge base.│
│                                                                      │
│ ┌────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ Upload documents           │ │ Live processing                   │ │
│ │                            │ │                                   │ │
│ │  Drag files here           │ │ uploaded   ● completed            │ │
│ │  PDF TXT DOCX MD           │ │ parsing    ● completed            │ │
│ │                            │ │ chunking   ● in progress          │ │
│ │  [ Browse files ]          │ │ embedding  ○ pending              │ │
│ │                            │ │ indexing   ○ pending              │ │
│ └────────────────────────────┘ └───────────────────────────────────┘ │
│                                                                      │
│ Document library                                                     │
│ ┌──────────────┬─────────────┬──────────┬─────────┬───────────────┐ │
│ │ File         │ Status      │ Chunks   │ Size    │ Uploaded      │ │
│ ├──────────────┼─────────────┼──────────┼─────────┼───────────────┤ │
│ │ policy.pdf   │ completed   │ 42/42    │ 1.2 MB  │ today         │ │
│ │ faq.md       │ indexing    │ 18/24    │ 80 KB   │ today         │ │
│ └──────────────┴─────────────┴──────────┴─────────┴───────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Required UI states

- Empty document library.
- Drag active state.
- Uploading state.
- Processing stage progress.
- Completed document.
- Failed document with error message.
- Unsupported file type error.

## Components

- `DocumentDropzone`
- `ProcessingTimeline`
- `DocumentTable`
- `DocumentStatusBadge`
- `UploadProgressCard`
- `RetryProcessingButton` if supported

---

# 6. Settings page — `/settings`

## Layout intent

Configuration page with secure model settings. API keys must be masked after save and never rendered as raw stored secrets.

## Wireframe

```txt
┌──────────────────────────────────────────────────────────────────────┐
│ RAGFlow Studio   Chat   Documents   Settings                User ▾   │
├──────────────────────────────────────────────────────────────────────┤
│ Settings                                                             │
│ Configure models used for chat and embeddings.                       │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Chat model                                                       │ │
│ │ Provider       [ OpenAI                         ▾ ]              │ │
│ │ Model name     [ gpt-4.1-mini                    ]               │ │
│ │ API key        [ •••••••••••••••••••••••••       ]               │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Embedding model                                                  │ │
│ │ Provider       [ OpenAI                         ▾ ]              │ │
│ │ Model name     [ text-embedding-3-small          ]               │ │
│ │ API key        [ •••••••••••••••••••••••••       ]               │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│                                      [ Save configuration ]           │
└──────────────────────────────────────────────────────────────────────┘
```

## Required UI states

- Initial empty settings.
- Masked saved settings.
- Saving state.
- Save success toast.
- Validation errors.
- API failure error.

## Components

- `SettingsForm`
- `ProviderSelect`
- `ModelInput`
- `SecretInput`
- `SaveBar`

---

# 7. Error and empty states

## Generic app error

```txt
┌──────────────────────────────┐
│ Something went wrong          │
│ The operation could not finish│
│ [ Try again ]                 │
└──────────────────────────────┘
```

## Empty documents

```txt
┌─────────────────────────────────────┐
│ No documents indexed yet             │
│ Upload your first file to start RAG. │
│ [ Upload document ]                  │
└─────────────────────────────────────┘
```

## Empty chat

```txt
┌──────────────────────────────────────┐
│ Ask your knowledge base               │
│ Upload documents, then ask questions. │
│ Suggested: "Summarize my documents"   │
└──────────────────────────────────────┘
```

---

# 8. Accessibility requirements

- All form inputs must have labels.
- Buttons must have visible focus states.
- Color cannot be the only indicator of status.
- Progress timeline must expose text labels.
- Chat composer must be submit-able by keyboard.
- Error messages must be associated with fields where possible.

# MVP-first wireframe update

## MVP navigation

```txt
+-----------------------------------------------------+
| RAGFlow Studio        Documents   Chat   Settings   |
+-----------------------------------------------------+
```

Settings is allowed in MVP, but it should initially show default configuration status rather than editable advanced settings.

## MVP chat page

```txt
+-----------------------------------------------------+
| RAGFlow Studio                         New Chat     |
+----------------------+------------------------------+
| Chats                | Chat                         |
| + New chat           | Model: Default server model  |
|                      | Thinking: Default            |
| Recent               |                              |
| - Upload policy Q&A  | User: What does my doc say?  |
| - Product notes      |                              |
|                      | Assistant: Based on your...  |
|                      |                              |
|                      | [ Ask your documents... ] -> |
+----------------------+------------------------------+
```

## MVP documents page

```txt
+-----------------------------------------------------+
| Documents                                           |
| Upload documents to chat with your private data.    |
|                                                     |
| +-----------------------------------------------+   |
| | Drop TXT or Markdown file here                |   |
| | PDF/DOCX coming after MVP                     |   |
| +-----------------------------------------------+   |
|                                                     |
| Processing                                         |
| [x] Uploaded -> [x] Parsed -> [x] Chunked          |
| [x] Embedded -> [x] Indexed                        |
|                                                     |
| Uploaded documents                                 |
| policy.md        Completed       Chat ready         |
+-----------------------------------------------------+
```

## Later-phase MCP tools settings mockup

```txt
+-----------------------------------------------------+
| Settings                                            |
| Models | Embeddings | Credentials | MCP Tools       |
+-----------------------------------------------------+
| MCP Tools                                           |
|                                                     |
| [ Add MCP Server ]                                  |
|                                                     |
| Name          Transport   Status      Tools         |
| Search Tools  HTTP        Enabled     4 tools       |
| Local Tools   stdio       Disabled    Not loaded    |
|                                                     |
| Add / Edit Server                                   |
| Transport: ( HTTP v )                               |
| URL: https://example.com/mcp                        |
| Headers: Authorization ********                     |
| [ Test connection ] [ Save ]                        |
+-----------------------------------------------------+
```

Implementation note:

- The runtime UI may use a dialog-style add/edit flow as long as the `MCP Tools` tab preserves this list-plus-editor structure and keeps stored secrets masked.

---

# 6. History page — `/history`

## Layout intent

A professional audit-style run history surface that shows the user how the agent answered, which tools ran, and which LangSmith run tracked the interaction.

## Wireframe

```txt
┌───────────────────────────────────────────────────────────────────────────┐
│ RAGFlow Studio   Chat   Documents   History   Settings          User ▾    │
├───────────────────────┬───────────────────────────────────────────────────┤
│ Filters               │ Run history                                        │
│                       │                                                    │
│ Date range            │ Session: Policy Q&A                               │
│ Tool type             │ User: What does the refund policy say?            │
│ Status                │ Assistant: Based on your documents...             │
│                       │ Tools: pinecone.query, runtime.mcp.weather        │
│                       │ LangSmith run: trace-123                          │
│                       │ Status: completed                                 │
│                       │                                                    │
│                       │ Session: Research                                 │
│                       │ ...                                               │
└───────────────────────┴───────────────────────────────────────────────────┘
```

## Required UI states

- Empty history.
- Loading history.
- Error loading history.
- Run with built-in tools only.
- Run with runtime MCP tool activity.

---

# 7. Document detail page — `/documents/:documentId`

## Layout intent

A focused inspection page for one uploaded document with clear metadata, chunk insights, embedding/index status, and private access actions.

## Wireframe

```txt
┌───────────────────────────────────────────────────────────────────────────┐
│ Back to Documents                                                         │
│                                                                           │
│ Document: employee-handbook.md              [ View file ] [ Download ]    │
│ Status: Completed    Chunks: 24    Strategy: recursive-words              │
│ Embedding model: text-embedding-3-small                                   │
│                                                                           │
│ Chunks                                                                     │
│ #0   112 tokens   vector:user:doc:0   "Welcome to the company..."         │
│ #1   108 tokens   vector:user:doc:1   "Managers are responsible..."       │
│                                                                           │
│ Embedding / indexing                                                       │
│ Namespace: user:uuid                                                      │
│ Vectors indexed: 24                                                       │
└───────────────────────────────────────────────────────────────────────────┘
```

## Required UI states

- Loading detail page.
- Document not found.
- Processing document with partial metadata.
- Completed document with private access actions.
- Failed document with error state.

---

# 8. Admin page — `/admin`

## Layout intent

A restrained control plane for one shared assistant. Operational and configuration focused, without any user document-content visibility.

## Wireframe

```txt
┌───────────────────────────────────────────────────────────────────────────┐
│ RAGFlow Studio   Chat   Documents   History   Settings   Admin   User ▾   │
├───────────────────────────────────────────────────────────────────────────┤
│ Shared assistant                                                          │
│ System prompt                                                             │
│ [ multiline prompt editor                                      ]          │
│                                                                           │
│ Built-in tools                                                            │
│ [x] Vector search   [x] Date/time   [x] Web search                        │
│                                                                           │
│ Global MCP                                                                │
│ Name              Transport   Status     Tools                            │
│ Remote Research   HTTP        Enabled    3                                │
│                                                                           │
│ Operations summary                                                        │
│ Runs today: 42    Success rate: 95%    Active users: 11                   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Required UI states

- Non-admin access denied.
- Empty global MCP state.
- Save success and error states for system prompt and tool policy.
- Operational summary with metadata only, never user document content.
