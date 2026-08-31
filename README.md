# CIVORA

CIVORA is a personal life-administration product that turns important documents into clear explanations, trusted deadlines, and useful actions.

> **Current status:** active founding build. The authenticated development path now covers signup, onboarding, bounded private upload, durable processing state, schema-validated OpenAI analysis, source-backed actions, Today, and authorized source download. Activation requires PostgreSQL and server secrets; live model credentials have not been verified, and production object storage is intentionally unavailable until a durable private adapter is configured. Do not upload real personal information.

## Run locally

Requirements:

- Node.js 22.19 or another version allowed by `package.json`
- Corepack (included with the repository's expected Node setup)

```bash
corepack pnpm install
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The product preview starts at `/app/today`.

On machines where Corepack shims cannot be installed globally, prefix pnpm commands with `corepack` as shown above.

## Quality commands

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm check
```

## Repository map

```text
src/app/                  Routes and composition
src/components/           Shared brand, UI, marketing, and app-shell components
src/features/             Feature-owned UI, domain logic, fixtures, and unit tests
src/lib/                  Narrow cross-feature utilities
public/                   Static public assets only
```

Server-only auth, database, storage, job, and AI boundaries live under `src/server/`. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the target system and [ROADMAP.md](./ROADMAP.md) for implementation truth.

## Environment

Copy `.env.example` to `.env` only when a milestone needs external configuration. Never commit `.env*` files other than `.env.example`, and never place server secrets in `NEXT_PUBLIC_*` variables.

The preview needs no credentials. To activate the authenticated development flow, configure `DATABASE_URL`, a 32+ character `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENAI_API_KEY`, and an explicit `OPENAI_MODEL`, then run `corepack pnpm db:generate` and `corepack pnpm db:deploy`. A scheduled production worker can call the protected document-job endpoint with `CIVORA_JOB_SECRET`; the request-local `after()` path is development convenience, not the production durability boundary. This machine has no PostgreSQL service, so migrations and the full authenticated document-to-action journey run against isolated PostgreSQL services in CI.

## Product and security

- [PRODUCT.md](./PRODUCT.md) — promise, principles, scope, flows, and terminology
- [ARCHITECTURE.md](./ARCHITECTURE.md) — target architecture and decision record
- [SECURITY.md](./SECURITY.md) — threat model, controls, and current limitations
- [ROADMAP.md](./ROADMAP.md) — checked implementation status and progress log
- [AGENTS.md](./AGENTS.md) — persistent engineering rules

The repository is not production-ready and must not be used for real sensitive documents until the release gates in `ROADMAP.md` and `SECURITY.md` are complete.
