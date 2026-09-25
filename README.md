# CIVORA

CIVORA is a personal life-administration product that turns important documents into clear explanations, trusted deadlines, and useful actions.

> **Current status:** active founding build. The authenticated path now covers signup, onboarding, bounded private upload, durable processing, schema-validated OpenAI analysis, source-backed actions, Today, document search, authorized source download, and coordinated deletion. A fail-closed S3-compatible production adapter is implemented, but PostgreSQL, object-storage, scheduler, and live model deployment credentials have not been verified. Do not upload real personal information.

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

## Vercel preview

`vercel.json` pins installation to the repository's Corepack/pnpm version and
generates Prisma before the Next.js build. The build-only placeholder database
URL is never set in the deployed runtime. No service credentials are needed to
view the fictional demo at `/app/today`; authentication remains disabled.

For the real workspace, configure PostgreSQL, private S3-compatible storage,
authentication, a live AI model, and an external scheduler before enabling use.
New uploads are limited to 4 MB, including a bounded multipart allowance below
Vercel's 4.5 MB function payload ceiling. The storage adapter keeps its existing
10 MB read ceiling for older development documents; larger legacy downloads need
a different delivery path before importing them into this deployment. Do not enable
the CI integration-test AI or local storage on Vercel.

## Scheduled recovery on Vercel

The daily recovery cron calls `GET /api/internal/jobs/documents` with
`CRON_SECRET`. Configure a separate random secret of at least 32 characters
in the production environment before deploying. Missing configuration returns
503; invalid credentials return 401 before any job or deletion runs.

The `0 4 * * *` schedule is a daily recovery sweep, not a prompt-processing
guarantee. It processes a bounded batch and reuses existing database leases.
A frequent external worker can still use POST with `CIVORA_JOB_SECRET`.
The two credentials are intentionally independent. Verify queue age and cleanup
completion with synthetic documents before opening the real workspace.

Vercel cron jobs run on production deployments; a Ready preview does not prove
the scheduler works. See [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
and [schedule limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
No live scheduler configuration is claimed yet.

## Container deployment

The root `Dockerfile` builds the locked application and generates its Prisma
client, then starts Next.js as a non-root user on `PORT` (default `3000`).
The build does not require live database or AI credentials. `.dockerignore`
excludes local secrets, uploaded documents, test artifacts, and generated files.

With no runtime credentials, only the fictional product preview is available;
authentication remains disabled. For a real workspace, configure the services
listed under Environment, apply migrations before enabling traffic, and verify
the live document-to-action flow. Never use the deterministic CI AI in a deployment.

Deployment status on 2026-09-12: Railway rejected project creation because the
account trial has expired. No new service or online deployment was created.
The Docker build has not yet been run by a container host.

## Document chat

The authenticated AI entry point is `/workspace/ai`. Select an analyzed document
for a private conversation at `/workspace/ai/[documentId]`. Questions and answers
are saved in PostgreSQL before delivery. Citations resolve to server-selected
excerpts from that document, and clearing history deletes both questions and answers.
Deleting a document or its analysis cascades to the associated chat records.

The live adapter uses the existing `OPENAI_API_KEY` and `OPENAI_MODEL`, disables
provider-side response storage, and sends bounded extracted evidence plus up to
six earlier turns. Questions are limited to 2,000 characters, conversations to 40
turns, and requests to 50 per rolling 24 hours per user. Request IDs prevent repeat
charges from duplicate submissions; a pending request expires after two minutes.
Model/token metadata is persisted; monetary cost is unknown until model pricing
is configured. No tools or external actions are available to the chat model.

Apply the new additive `20260913180000_document_chat` migration before enabling
this feature in a configured environment. This milestone uses complete responses,
not token streaming. Cross-document retrieval and live-provider evaluation remain
pending. The integration-test adapter is isolated to explicitly enabled CI tests.

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

The preview needs no credentials. To activate the authenticated development flow, configure `DATABASE_URL`, a 32+ character `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENAI_API_KEY`, and an explicit `OPENAI_MODEL`, then run `corepack pnpm db:generate` and `corepack pnpm db:deploy`. Production also requires the `s3` storage driver and its bucket configuration from `.env.example`. A scheduled worker can call the protected document-job endpoint with `CIVORA_JOB_SECRET`; the request-local `after()` path is development convenience, not the production durability boundary. This machine has no PostgreSQL service, so migrations and the full authenticated journey run against isolated PostgreSQL services in CI.

## Product and security

- [PRODUCT.md](./PRODUCT.md) — promise, principles, scope, flows, and terminology
- [ARCHITECTURE.md](./ARCHITECTURE.md) — target architecture and decision record
- [SECURITY.md](./SECURITY.md) — threat model, controls, and current limitations
- [ROADMAP.md](./ROADMAP.md) — checked implementation status and progress log
- [AGENTS.md](./AGENTS.md) — persistent engineering rules

The repository is not production-ready and must not be used for real sensitive documents until the release gates in `ROADMAP.md` and `SECURITY.md` are complete.

## Release and operations

Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the live launch gates and
[OPERATIONS.md](OPERATIONS.md) for migration, recovery, backup/restore and incident
procedures. They distinguish verified code from infrastructure and drills that
still need to be configured and exercised.
