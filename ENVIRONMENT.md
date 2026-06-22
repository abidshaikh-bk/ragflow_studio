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
| `LANGSMITH_API_KEY` | Yes | No | LangSmith tracing |
| `LANGSMITH_PROJECT` | Yes | No | LangSmith project name |
| `LANGCHAIN_TRACING_V2` | Yes | No | Enable LangSmith tracing |
| `TAVILY_API_KEY` | Yes | No | Tavily web search |
| `OPENAI_API_KEY` | Optional | No | Chat/embedding provider |
| `ANTHROPIC_API_KEY` | Optional | No | Chat provider |
| `GEMINI_API_KEY` | Optional | No | Chat provider |
| `HUGGINGFACE_API_KEY` | Optional | No | Model provider |
| `APP_ENCRYPTION_KEY` | Recommended | No | Encrypt saved user provider credentials at rest |
| `APP_ENCRYPTION_KEY_VERSION` | Recommended | No | Version tag stored with encrypted provider credentials |
| `APP_URL` | Yes | No | Local or deployed app URL |

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

## Notes

- Only variables prefixed with `NEXT_PUBLIC_` are safe for the browser.
- Never put provider keys in frontend code.
- Never commit `.env.local`.
- `DATABASE_URL` must be a valid, reachable Postgres connection string for the Supabase project if migrations or live RLS validation will run.
- `TAVILY_API_KEY` is consumed only by the server-side web-search helper.
- `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, and `LANGCHAIN_TRACING_V2` are consumed only by the server-side LangGraph agent tracing path.
- `APP_ENCRYPTION_KEY` is used to encrypt saved provider credentials before they are written to Supabase. If it is unset in local development, the server falls back to deriving an encryption key from `SUPABASE_SERVICE_ROLE_KEY`.


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

Do not enable runtime MCP until Phase 4 tasks are implemented and tested.
