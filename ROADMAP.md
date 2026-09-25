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
- [x] Production S3-compatible private object-storage adapter with bounded reads, location binding, never-versioned deletion checks, and fail-closed configuration.
- [ ] Configure and verify the deployment bucket, access policy, never-versioned status, encryption, lifecycle, and credentials.
- [x] Authenticated upload with a durable hidden intent, bounded request streaming, file byte/signature checks, safe key, hash, atomic attempt limit, and audit events.
- [x] Persisted `QUEUED → PROCESSING → READY | NEEDS_REVIEW | FAILED` lifecycle.
- [x] Database job boundary with lease fencing, retry state, stale-lock recovery, request-local development execution, and protected scheduler endpoint.
- [ ] Deploy and verify the external production scheduler/worker that invokes the job endpoint.
- [x] Official OpenAI Responses adapter with strict structured output, prompt-injection separation, provenance, confidence, safety gating, and versioning.
- [ ] Verify the OpenAI adapter with approved live credentials and model configuration.
- [x] Persisted document detail, authenticated source download, generated actions, completion/reopen API, source linkage, and real Today prioritization.
- [x] Workspace-scoped document search and coordinated source/derivative deletion with worker fencing.
- [x] Persisted Open/Completed/Dismissed views on Today, completion/dismissal/reopen controls, source links, and recoverable request errors.
- [x] Manual action creation and editing with validated fields, session-bound ownership, and atomic audit events.
- [x] PostgreSQL integration coverage plus authenticated browser E2E and cross-tenant route/file/action denial.

## MVP quality gate

A new user can sign up, onboard, upload a real supported document, see durable processing state, receive validated source-backed analysis, review facts/deadlines/actions, complete an action on Today, find and revisit the source, and delete their data on mobile and desktop. Lint, typecheck, unit/integration tests, production build, and critical Playwright flows pass. Fixtures do not count toward this gate.

## Beta

- [ ] Grounded CIVORA AI with bounded conversation persistence, authorized retrieval, source links, streaming, usage accounting, and failure states.
- [ ] Persisted notifications, deadline scheduling, timezone handling, preferences, and one configured external channel if credentials exist.
- [ ] Money intelligence from documents without implying bank access.
- [ ] Privacy export/account deletion, observability, analytics abstraction, accessibility/performance/security audits.
- [x] `RELEASE_CHECKLIST.md` and operational runbooks prepared from current code.
- [ ] Configure backups/monitoring and rehearse restore, deletion reconciliation, rollback and incident procedures against real infrastructure.

## V1 and monetization

- [ ] Central Free/Plus plan configuration and server-enforced usage limits.
- [ ] Stripe Checkout, portal, signed/idempotent webhooks, subscription synchronization and test-mode E2E.
- [ ] Production database/storage/jobs/email/error monitoring deployment with verified secrets, migrations, rollback, and smoke tests.
- [ ] Legal review, privacy/subprocessor disclosures, security contact, support process, and real beta feedback gates.

## Post-V1 candidates — not current implementation scope

CIVORA Family, email ingestion, calendar providers, contract-change detection, subscription intelligence, native mobile/push, legitimate digital identity/BankID/open-banking integrations, advanced multilingual analysis, personal knowledge graph, and human-confirmed agentic preparation workflows.

## Progress log

- **2026-09-25 — Session security:** added confirmed sign-out of other sessions from settings. The server rechecks the current session, scopes deletion to its authenticated owner, preserves the active session and audits the change atomically. Tests cover other users, forged session identity, repeated requests and real second-device logout. Password reset/account recovery remain separate pending features.

- **2026-09-25 — Workspace export:** added an authenticated JSON download in settings for the personal workspace, account/preferences, current documents with their latest analyses, actions and the requesting user’s private chat turns. Explicit field selection excludes credentials/storage locators; deleted records and other members’ chats are excluded. Membership is checked in a repeatable-read transaction and successful generation is audited. The bounded first version rejects oversized exports rather than silently truncating (500 rows per section, 3 MB); original files, older analyses, audit records and other workspaces are excluded. Full privacy export and account deletion remain open.

- **2026-09-25 — Release preparation:** added a concrete release gate checklist and operations runbook covering live acceptance, independent scheduler credentials, bounded recovery, terminal failures, deletion tombstones, private chat failure states, migrations, compatible rollback and isolated restore with deletion reconciliation. These are prepared procedures; backups, alerts and live drills remain unverified. AI-chat checkpoint `bec8493` passed all three CI jobs in run 36093521385, including desktop/mobile journeys.

- **2026-09-13 — Document chat:** added an authenticated document-scoped AI conversation with saved question/answer IDs, source citations resolved against authorized excerpts, per-user history, clearing, request deduplication, bounded context and daily reservations. Chat derivatives cascade with analysis/document deletion and late completions cannot recreate them. Model and token usage are recorded; monetary cost is unknown (nullable), not guessed. OpenAI credentials and a selected model remain required; deterministic responses are limited to explicit CI environments. Streaming, cross-document retrieval, and live-provider verification remain pending. Additive migration and security/persistence E2E checks accompany this checkpoint.

- **2026-09-13 — Editable preferences:** added an authenticated settings page for saved language, explanation style, and time zone, with server validation, owner-bound updates, atomic audit, and recoverable errors. Preferences remain forward-looking; full localization and personalized analysis are not claimed. Added authorization/validation tests and desktop/mobile persistence assertions. Today now marks overdue, due-today, and due-tomorrow actions using the saved time zone while preserving all-day calendar dates. Provider configuration is deferred at the user’s request.

- **2026-09-13 — Scheduler preparation:** added a protected GET entry point and a daily Vercel recovery schedule, retaining the separately authenticated POST worker. Authorization tests cover absent/short configuration, missing/incorrect/cross-endpoint credentials, and authorized processing plus deletion cleanup. Local execution is unavailable; GitHub CI must validate this checkpoint. Live scheduler activation remains blocked by Vercel access and provider configuration.

- **2026-09-13 — Verified checkpoint:** GitHub run 34738486329 passed quality, database integration, and desktop/mobile critical E2E on 7d35d42913e807671e32e54dca8d13c8eab221f1 (84 unit tests). The user screenshot confirms new preview CNJdyvi4S is Ready. Neon project dark-boat-77272588, production branch br-misty-queen-artlrxts, database civora is provisioned and connectivity checked; it has no application tables yet. Vercel project reads still return 403 despite reconnection. No live account, storage, or AI verification is claimed.

- **2026-09-13 — Manual actions and hosted uploads:** added create/edit forms on the persisted Today page, authenticated create/edit APIs, strict input/date validation, source-link preservation, and atomic audit events. New uploads are capped at 4 MB with multipart headroom for Vercel; existing storage-read limits are preserved. Local tests/build pass; expanded desktop/mobile E2E is pending this milestone's CI. The user confirmed the original Vercel deployment shows Ready. Neon connection is requested to provision the real database; live account/data functionality still requires provider configuration.

- **2026-09-12 — Vercel selected:** added and locally validated a credential-free preview build using `vercel.json`, plus `.vercelignore`. Vercel accepted preview deployment `dpl_CqNYtf3PzEpkgJtgD1AzcXz2PvVA` at `https://civora-jsqslc19m-mohammedhassantuf-1939.vercel.app`. Its last confirmed state is INITIALIZING: status/log reads and protected URL verification returned a scope authorization error. READY and browser availability are not verified. Before real use, adapt the 10 MB upload/source-download flow to the host's 4.5 MB function payload limit and configure the live providers. No live authentication, storage, or AI was enabled by this preview deployment.

- **2026-09-12 — Deployment handoff:** added a non-root Docker build/start configuration with local secrets and uploaded data excluded from its build context. Railway rejected project creation because the account trial is expired; no new service was created and no live deployment is claimed. Container-host validation and runtime provider setup remain pending.

- **2026-09-12 — Core-flow stabilization:** the latest CI failure occurs when the browser test reloads immediately after clicking Dismissed, before client navigation commits. Status-view tests now wait for both the destination URL and active tab before proceeding. CI also covers the documented short-lived branch names and retains preview screenshots and failure traces. Local lint, typecheck, 73 unit tests, build, formatting, and production dependency audit pass. Local browser execution is blocked by the execution environment. GitHub run 34709230881 passed all three jobs (quality, database-integration, critical-path-e2e) on commit 0cb86c36288c87d64b9d0f70d61f31e7744509a8, including both desktop and mobile authenticated journeys with the deterministic test AI. Preview screenshots are retained in its civora-ui-previews artifact. Production database, storage, scheduler, and live AI verification remain release blockers. Current priority is the document-to-action MVP; Beta and monetization remain deferred.

- **2026-08-31 — Foundation started:** repository verified and isolated on `codex/civora-foundation`; official Next.js scaffold established; original visual system, marketing experience, application preview surfaces, core documentation, file policy, prioritization logic, and first unit tests created. External credentials are not needed for this milestone and no real-user functionality is claimed.
- **2026-08-31 — Identity foundation:** Prisma migration, Better Auth, automatic personal workspaces, persisted onboarding, protected workspace UI, authorization policies, and PostgreSQL-backed CI tests implemented. Local PostgreSQL and production credentials remain external blockers.
- **2026-08-31 — Document-to-action slice:** bounded private upload, durable/recoverable job state, structured OpenAI adapter, safety-gated evidence/actions, Today completion, authorized source retrieval, additive migration upgrade verification, and full PostgreSQL-backed browser flow implemented. Production storage/worker deployment and live AI credentials remain explicit blockers.
- **2026-09-01 — Core privacy and retrieval:** crash-recoverable upload intents, location-bound/version-safe S3 architecture, real workspace document search, coordinated deletion with fair retries, worker-race protection, and end-to-end delete verification added. Deployment credentials and live-provider checks remain external blockers.
