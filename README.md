# CIVORA

CIVORA is a personal life-administration product that turns important documents into clear explanations, trusted deadlines, and useful actions.

> **Current status:** active founding build. The marketing and application surfaces remain an explicitly labeled fictional preview. The PostgreSQL schema/migration, Better Auth boundary, personal-workspace bootstrap, onboarding persistence, and protected workspace route are implemented; activation still requires PostgreSQL and server secrets. Private file storage and live AI analysis are not yet enabled. Do not upload real personal information.

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

The preview needs no credentials. To activate real signup/onboarding, configure `DATABASE_URL`, a 32+ character `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`, then run `corepack pnpm db:generate` and `corepack pnpm db:deploy`. This machine has no PostgreSQL service, so the migration and real auth/tenant flow run in the isolated PostgreSQL CI job.

## Product and security

- [PRODUCT.md](./PRODUCT.md) — promise, principles, scope, flows, and terminology
- [ARCHITECTURE.md](./ARCHITECTURE.md) — target architecture and decision record
- [SECURITY.md](./SECURITY.md) — threat model, controls, and current limitations
- [ROADMAP.md](./ROADMAP.md) — checked implementation status and progress log
- [AGENTS.md](./AGENTS.md) — persistent engineering rules

The repository is not production-ready and must not be used for real sensitive documents until the release gates in `ROADMAP.md` and `SECURITY.md` are complete.
