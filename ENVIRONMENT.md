# ENVIRONMENT.md — Environment Setup

## Required environment variables

Copy `.env.example` to `.env.local` and fill all required values.

```bash
cp .env.example .env.local
```

## Variables

| Variable | Required | Browser-visible | Purpose |
|---|---:|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | No | Server-side processing and migrations only |
| `DATABASE_URL` | Yes | No | Database connection for migrations if used |
| `AWS_REGION` | Yes | No | S3 region |
| `AWS_ACCESS_KEY_ID` | Yes | No | S3 server-side access |
| `AWS_SECRET_ACCESS_KEY` | Yes | No | S3 server-side access |
| `S3_BUCKET_NAME` | Yes | No | Private document bucket |
| `PINECONE_API_KEY` | Yes | No | Pinecone access |
| `PINECONE_INDEX_NAME` | Yes | No | Pinecone index |
| `PINECONE_VECTOR_DIMENSION` | Yes | No | Pinecone index vector dimension expected by embedding configs |
| `LANGSMITH_API_KEY` | Yes | No | LangSmith tracing |
| `LANGSMITH_PROJECT` | Yes | No | LangSmith project name |
| `LANGCHAIN_TRACING_V2` | Yes | No | Enable LangSmith tracing |
| `TAVILY_API_KEY` | Yes | No | Tavily web search |
| `OPENAI_API_KEY` | Optional | No | Chat/embedding provider |
| `ANTHROPIC_API_KEY` | Optional | No | Chat provider |
| `GEMINI_API_KEY` | Optional | No | Chat provider |
| `HUGGINGFACE_API_KEY` | Optional | No | Model provider |
| `APP_ENCRYPTION_KEY` | Recommended | No | Encrypt saved user provider credentials and runtime MCP secrets at rest |
| `APP_ENCRYPTION_KEY_VERSION` | Recommended | No | Version tag stored with encrypted provider credentials and runtime MCP secrets |
| `APP_URL` | Yes | No | Local or deployed app URL |
| `MCP_RUNTIME_ENABLED` | Later phase | No | Feature flag for runtime MCP loading |
| `MCP_STDIO_ALLOWLIST` | Later phase | No | Comma-separated stdio commands allowed for runtime MCP spawning |
| `MCP_HTTP_TIMEOUT_MS` | Later phase | No | Default runtime MCP HTTP timeout when a config does not override it |

## Local development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npm run db:migrate
npm run test:db
npm run build
```

## Production runtime

The app is configured with Next.js standalone output for production deployment.

After `npm run build`, start the generated server with:

```bash
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Production deployments must provide the same server-side secrets documented above through the hosting platform's secret manager or environment configuration.

## Notes

- Only variables prefixed with `NEXT_PUBLIC_` are safe for the browser.
- Never put provider keys in frontend code.
- Never commit `.env.local`.
- `DATABASE_URL` must be a valid, reachable Postgres connection string for the Supabase project if migrations or live RLS validation will run.
- `TAVILY_API_KEY` is consumed only by the server-side web-search helper.
- `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, and `LANGCHAIN_TRACING_V2` are consumed only by the server-side LangGraph agent tracing path.
- `APP_ENCRYPTION_KEY` is used to encrypt saved provider credentials before they are written to Supabase. If it is unset in local development, the server falls back to deriving an encryption key from `SUPABASE_SERVICE_ROLE_KEY`.
- `DEFAULT_EMBEDDING_PROVIDER=gemini` is supported by the runtime embedding service. When `DEFAULT_EMBEDDING_MODEL` is blank, the server defaults to `gemini-embedding-2`.
- `PINECONE_VECTOR_DIMENSION` is enforced by the settings API and passed through to embedding requests so generated vectors match the Pinecone index shape before upsert.
- Playwright injects `E2E_AUTH_BYPASS=true` and `NEXT_PUBLIC_E2E_AUTH_BYPASS=true` only for `npm run test:e2e`; do not add them to committed environment files for normal app usage.


## Git/GitHub prerequisites

Agents must have Git available locally.

Recommended setup before coding:

```bash
git --version
git status
```

If a GitHub remote is available, configure `origin` before starting task branches. See `GITHUB.md`.

# MVP default model and MCP environment

For MVP, use server-side default model settings instead of per-user configurable credentials.

Required MVP defaults:

```bash
DEFAULT_CHAT_PROVIDER=openai
DEFAULT_CHAT_MODEL=
DEFAULT_EMBEDDING_PROVIDER=openai
DEFAULT_EMBEDDING_MODEL=
```

Runtime MCP is disabled by default:

```bash
MCP_RUNTIME_ENABLED=false
MCP_STDIO_ALLOWLIST=
MCP_HTTP_TIMEOUT_MS=30000
```

Do not enable runtime MCP until Phase 10 tasks are implemented and tested.

## Professional refresh environment notes

The next UI and admin refinement phase does not require browser-visible secrets. Keep all new configuration server-side.

- Private document access continues to rely on the existing S3 credentials and bucket configuration.
- LangSmith history enrichment continues to rely on the existing server-side LangSmith environment variables only.
- Global assistant configuration is planned as database-backed application state, not as frontend environment variables.
- If presigned URL expiration tuning is introduced later, keep it server-only and document it before use.
