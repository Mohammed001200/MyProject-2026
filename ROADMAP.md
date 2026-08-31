# CIVORA Roadmap

This file records implementation truth. A checked item is backed by running code and an appropriate quality check; target architecture in other documents is not delivery.

## Current milestone — tangible product foundation

- [x] Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, pnpm lockfile.
- [x] Original CIVORA light/dark semantic design system and code-native brand mark.
- [x] Responsive premium marketing page: hero, product preview, workflow, capabilities, security, pricing preview, FAQ, CTA, footer.
- [x] Honest privacy, terms, and security pre-launch surfaces.
- [x] Responsive app shell with desktop sidebar, mobile bottom navigation, theme control, and preview labeling.
- [x] Today attention flow with fictional fixtures, completion/reopen interaction, upcoming and recent-document states.
- [x] Searchable/filterable fictional document library and evidence-oriented detail preview.
- [x] Local-only upload-state preview with shared file policy; no data leaves the browser.
- [x] Actions, Inbox, settings, and grounded CIVORA AI interaction previews with explicit non-production labeling.
- [x] Unit tests for upload policy and action prioritization.
- [x] Lint and strict typecheck passing.
- [x] Production build passing; desktop/mobile Edge E2E smoke tests and screenshot review completed.
- [x] GitHub Actions quality workflow for install, lint, typecheck, unit tests, build, and browser smoke tests.
- [ ] English/Swedish localization resources and locale routing.

## Milestone 2 — real identity and workspace foundation

- [x] Validated Prisma 7 PostgreSQL schema and baseline migration with relational constraints.
- [x] Better Auth signup, login, logout, safe disabled state, and server sessions; verification/recovery awaits an email provider.
- [x] `User`, `Profile`, `Workspace`, and `WorkspaceMember` with idempotent personal-workspace creation.
- [x] Central viewer, workspace, document, and action authorization policies with non-enumerating failures.
- [x] Persisted onboarding for language, time zone, and explanation style plus protected workspace route.
- [x] Isolated PostgreSQL CI coverage for migration, auth, workspace idempotency, constraints, and tenant denial.
- [ ] Run the same integration suite locally once PostgreSQL is available.

## Milestone 3 — real document-to-action vertical slice (MVP core)

- [x] Private storage interface and fail-closed local development adapter outside public assets.
- [ ] Production private object-storage adapter and deployment credentials.
- [x] Authenticated upload with bounded request streaming, file byte/signature checks, safe key, hash, atomic attempt limit, and audit events.
- [x] Persisted `QUEUED → PROCESSING → READY | NEEDS_REVIEW | FAILED` lifecycle.
- [x] Database job boundary with lease fencing, retry state, stale-lock recovery, request-local development execution, and protected scheduler endpoint.
- [ ] Deploy and verify the external production scheduler/worker that invokes the job endpoint.
- [x] Official OpenAI Responses adapter with strict structured output, prompt-injection separation, provenance, confidence, safety gating, and versioning.
- [ ] Verify the OpenAI adapter with approved live credentials and model configuration.
- [x] Persisted document detail, authenticated source download, generated actions, completion/reopen API, source linkage, and real Today prioritization.
- [ ] Document search, coordinated deletion, manual action creation, and dismiss UI.
- [x] PostgreSQL integration coverage plus authenticated browser E2E and cross-tenant route/file/action denial.

## MVP quality gate

A new user can sign up, onboard, upload a real supported document, see durable processing state, receive validated source-backed analysis, review facts/deadlines/actions, complete an action on Today, find and revisit the source, and delete their data on mobile and desktop. Lint, typecheck, unit/integration tests, production build, and critical Playwright flows pass. Fixtures do not count toward this gate.

## Beta

- [ ] Grounded CIVORA AI with bounded conversation persistence, authorized retrieval, source links, streaming, usage accounting, and failure states.
- [ ] Persisted notifications, deadline scheduling, timezone handling, preferences, and one configured external channel if credentials exist.
- [ ] Money intelligence from documents without implying bank access.
- [ ] Privacy export/account deletion, observability, analytics abstraction, accessibility/performance/security audits.
- [ ] `RELEASE_CHECKLIST.md`, operational runbooks, backup/restore and incident procedures.

## V1 and monetization

- [ ] Central Free/Plus plan configuration and server-enforced usage limits.
- [ ] Stripe Checkout, portal, signed/idempotent webhooks, subscription synchronization and test-mode E2E.
- [ ] Production database/storage/jobs/email/error monitoring deployment with verified secrets, migrations, rollback, and smoke tests.
- [ ] Legal review, privacy/subprocessor disclosures, security contact, support process, and real beta feedback gates.

## Post-V1 candidates — not current implementation scope

CIVORA Family, email ingestion, calendar providers, contract-change detection, subscription intelligence, native mobile/push, legitimate digital identity/BankID/open-banking integrations, advanced multilingual analysis, personal knowledge graph, and human-confirmed agentic preparation workflows.

## Progress log

- **2026-08-31 — Foundation started:** repository verified and isolated on `codex/civora-foundation`; official Next.js scaffold established; original visual system, marketing experience, application preview surfaces, core documentation, file policy, prioritization logic, and first unit tests created. External credentials are not needed for this milestone and no real-user functionality is claimed.
- **2026-08-31 — Identity foundation:** Prisma migration, Better Auth, automatic personal workspaces, persisted onboarding, protected workspace UI, authorization policies, and PostgreSQL-backed CI tests implemented. Local PostgreSQL and production credentials remain external blockers.
- **2026-08-31 — Document-to-action slice:** bounded private upload, durable/recoverable job state, structured OpenAI adapter, safety-gated evidence/actions, Today completion, authorized source retrieval, additive migration upgrade verification, and full PostgreSQL-backed browser flow implemented. Production storage/worker deployment and live AI credentials remain explicit blockers.
