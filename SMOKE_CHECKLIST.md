# MVP Smoke Checklist — 2026-06-23

This checklist records the current MVP launch gate for RAGFlow Studio.

## Validation commands run

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run db:migrate
npm run test:db
```

## Smoke status

- `PASS` User can register.
  Evidence: `src/tests/auth-forms.test.tsx`
- `PASS` User can log in.
  Evidence: `src/tests/e2e/auth.spec.ts`
- `PASS` User can save model settings.
  Evidence: `src/tests/settings-form.test.tsx`, `src/tests/settings-route.test.ts`
- `PASS` User can upload a document.
  Evidence: `src/tests/e2e/document-upload.spec.ts`
- `PASS` Document reaches completed status.
  Evidence: `src/tests/e2e/document-upload.spec.ts`
- `PASS` User can ask a document-grounded question.
  Evidence: `src/tests/e2e/chat-rag.spec.ts`
- `PASS` Agent retrieves from Pinecone-scoped document context.
  Evidence: `src/tests/vector-search-tool.test.ts`, `src/tests/e2e/tool-routing.spec.ts`
- `PASS` Agent uses the date tool.
  Evidence: `src/tests/date-time-tool.test.ts`, `src/tests/e2e/tool-routing.spec.ts`
- `PASS` Agent uses Tavily-style web search routing.
  Evidence: `src/tests/web-search-tool.test.ts`, `src/tests/e2e/tool-routing.spec.ts`
- `PASS` Chat history persists after refresh.
  Evidence: `src/tests/e2e/chat-rag.spec.ts`
- `PASS` LangSmith tracing path is covered.
  Evidence: `src/tests/langsmith-tracing.test.ts`
- `PASS` Raw secrets do not leak to browser-visible settings, logs, or trace previews.
  Evidence: `src/tests/settings-route.test.ts`, `src/tests/app-event-logger.test.ts`, `src/tests/langsmith-tracing.test.ts`
- `PASS` RLS prevents cross-user access in the live database validation path.
  Evidence: `npm run test:db`, `src/tests/database-schema.test.ts`
- `PASS` Production build succeeds.
  Evidence: `npm run build`

## Notes

- The Playwright suite uses a test-only auth bypass and isolated per-browser state so browser smoke coverage can run deterministically without seeded Supabase credentials.
- The browser smoke flows validate UI behavior and routing. The live database smoke path validates real RLS enforcement separately through `npm run test:db`.

---

# Refined IA Smoke Checklist — 2026-06-25

This follow-up checklist records the expanded application information architecture after History, document explorer, streaming chat, user MCP, and admin control-plane work landed.

## Validation commands run

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Smoke status

- `PASS` Logout controls remain wired through the protected shell without exposing session secrets.
  Evidence: `src/tests/user-menu.test.tsx`, `src/tests/logout-route.test.ts`
- `PASS` Streaming chat transport emits metadata, deltas, and completion events safely.
  Evidence: `src/tests/chat-stream-route.test.ts`, `src/tests/chat-route.test.ts`
- `PASS` History page and history APIs render saved runs, filters, and detail safely.
  Evidence: `src/tests/history-page.test.tsx`, `src/tests/history-route.test.ts`
- `PASS` Document explorer detail routes and private access links stay user-scoped.
  Evidence: `src/tests/document-detail-page.test.tsx`, `src/tests/document-detail-route.test.ts`, `src/tests/document-access-link-route.test.ts`
- `PASS` User BYO MCP settings remain secret-safe and scoped to the authenticated user.
  Evidence: `src/tests/mcp-routes.test.ts`, `src/tests/mcp-tools-settings.test.tsx`, `src/tests/mcp-backend-adapter.test.ts`
- `PASS` Admin controls stay guarded while the shared assistant and global MCP registry remain secret-safe.
  Evidence: `src/tests/admin-guards.test.tsx`, `src/tests/admin-assistant-route.test.ts`, `src/tests/admin-page.test.tsx`, `src/tests/admin-mcp-routes.test.ts`
- `PASS` The refined browser flows still cover auth, document upload, document-grounded chat, and tool routing end to end.
  Evidence: `src/tests/e2e/auth.spec.ts`, `src/tests/e2e/document-upload.spec.ts`, `src/tests/e2e/chat-rag.spec.ts`, `src/tests/e2e/tool-routing.spec.ts`
- `PASS` Production build succeeds with the refined route and API layout.
  Evidence: `npm run build`

## Visual QA Notes

- `/chat`: The three-pane desktop shell still renders with session history, main transcript, and context/tool panels visible in browser-backed tests; the streaming transport remains a backend concern and does not regress the chat layout.
- `/documents`: The upload dropzone, live pipeline card, explorer table, and detail drill-down states remain intact; the Playwright upload flow confirms the page can reach a completed indexed document state without overflow or broken transitions.
- `/history`: The audit-oriented list/detail split continues to show status, tool badges, and LangSmith-safe metadata with empty, loading, and error states covered in tests.
- `/settings`: The Models and MCP tabs remain visually separated, and masked-secret rendering stays in place for both provider credentials and user MCP configurations.
- `/admin`: The shared assistant prompt editor, built-in tool toggles, global MCP registry, and operations summary now coexist on one guarded page without exposing user document content.

## Notes

- These visual QA notes are based on the browser-rendered Playwright flows, component/page render coverage, and local layout review performed during `TASK-046` through `TASK-048`.
- No screenshot artifacts were committed; the verification record for this phase is the passing browser/API test evidence above.
