# MVP_FIRST.md — Delivery Strategy and Phase Gates

## Purpose

This project must first produce a default working MVP before adding advanced configurability. Agents must not optimize for future configurability at the cost of the base login, upload, index, and query flow.

## MVP success definition

The first production-ready slice is:

1. User can register and log in with Supabase Auth.
2. User can upload a supported document.
3. Backend stores the raw file privately in S3.
4. Backend parses the document.
5. Backend chunks extracted text.
6. Backend generates embeddings using the default server-side embedding configuration.
7. Backend stores vectors in Pinecone under a user-isolated namespace.
8. User can open a chat session.
9. User can ask a question about their own uploaded documents.
10. Assistant answers using only that user's indexed document chunks.
11. Chat history and document processing status are persisted in Supabase.
12. Basic LangSmith traces exist for document and chat flows where configured.

## Phase policy

### Phase 0 — Documentation and repo setup

Create repo, docs, env example, CI, progress log, and VCS workflow.

### Phase 1 — Working MVP core

Build only the default flow:

- Supabase Auth.
- Protected pages.
- Document upload.
- Document parsing for TXT and Markdown first.
- Chunking.
- Default embedding provider from server env.
- Pinecone indexing.
- Simple RAG chat over user documents.
- Multi-chat session list and message persistence.

### Phase 2 — Better UX and reliability

Add PDF/DOCX support, improved upload states, better empty/error states, more E2E coverage, and LangSmith polish.

### Phase 3 — User-configurable model settings

Add per-user providers, encrypted API keys, model picker, embedding config, and thinking-level controls.

### Phase 4 — Configurable Agentic RAG MCP system

Add user/admin-configurable MCP servers and dynamic tool availability using stdio or HTTP transports.

## Do-not-build-yet list for MVP phase

During Phase 1, agents must not build these unless their task explicitly says so:

- User-configurable MCP servers.
- Dynamic MCP tool registry.
- Per-user API key entry UI.
- Advanced thinking controls.
- Multi-provider model routing.
- Tavily web search as required path.
- PDF/DOCX if TXT/Markdown MVP is not complete.

## MVP default configuration

Use server-side environment variables:

- `OPENAI_API_KEY` or chosen default provider key.
- `DEFAULT_CHAT_PROVIDER`.
- `DEFAULT_CHAT_MODEL`.
- `DEFAULT_EMBEDDING_PROVIDER`.
- `DEFAULT_EMBEDDING_MODEL`.
- `PINECONE_API_KEY`.
- `PINECONE_INDEX_NAME`.

Per-user settings may be represented in schema early, but UI/API work for user-configurable providers belongs to Phase 3.
