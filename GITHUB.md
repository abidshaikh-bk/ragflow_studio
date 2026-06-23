# GITHUB.md — GitHub Repository Setup and PR Rules

Use this file when connecting the project to GitHub.

## 1. Initial repository setup

```bash
git init
git add .
git commit -m "TASK-001: initialize project documentation pack"
git branch -M main
git remote add origin https://github.com/abidshaikh-bk/ragflow_studio.git
git push -u origin main
```

Replace `https://github.com/abidshaikh-bk/ragflow_studio.git` with the actual repository URL.

## 2. Required GitHub settings

Recommended branch protection for `main`:

- Require pull request before merging.
- Require status checks to pass.
- Require branch to be up to date before merge.
- Disallow force pushes.
- Disallow deletion of `main`.

## 3. Required status checks

At minimum:

- Lint
- Typecheck
- Unit tests
- Build

Add E2E tests once Playwright is configured.

## 4. PR template

Create `.github/pull_request_template.md` with:

```md
## Task

TASK-ID:

## Summary

-
-
-

## Tests run

- [ ] npm run lint
- [ ] npm run typecheck
- [ ] npm run test
- [ ] npm run test:e2e
- [ ] npm run build

## Documentation updated

- [ ] TASKS.md
- [ ] PROGRESS_LOG.md
- [ ] design.md
- [ ] UI_MOCKUPS.md / UI_PAGES.md
- [ ] SECURITY.md
- [ ] TESTING.md
- [ ] ENVIRONMENT.md

## Screenshots

Required for UI tasks.

## Risks / follow-ups

-
```

## 5. GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

## 6. Secrets

Store deployment/runtime secrets only in GitHub Environments or the deployment platform, never in the repository.

Suggested GitHub secret names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `LANGSMITH_API_KEY`
- `TAVILY_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `HUGGINGFACE_API_KEY`

## 7. Production deployment notes

- The app builds with Next.js standalone output, so deployment targets can run `node .next/standalone/server.js`.
- Run `npm run build` in CI or the deployment platform before promotion.
- Provide `PORT` and `HOSTNAME=0.0.0.0` when starting the standalone server in a container or VM environment.
- Keep all server-side secrets in GitHub Environments or the host platform, never in committed config files.
```
