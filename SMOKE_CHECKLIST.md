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
