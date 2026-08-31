# CIVORA Architecture

> Status: target architecture and decision record for the founding build. A component is not implemented merely because it appears here. `ROADMAP.md`, the schema, tests, and running code are the implementation truth.

## Implementation snapshot — 2026-08-31

The repository currently runs Next.js 16.3.3, React 19.2.8, strict TypeScript 5.9, Tailwind CSS 4.3, Vitest 4, and the official Next ESLint configuration on Node 22.19. The visible product is a clearly labeled fictional preview; there is no authentication, database, object storage, background worker, live AI request, or billing path yet. Prisma 7, Better Auth, the OpenAI SDK, and provider adapters remain target decisions until their real vertical slice is implemented and tested.

## Architectural goals

CIVORA must make the document-to-action loop dependable while remaining simple enough for a startup team to operate. The architecture optimizes for tenant isolation, evidence-backed AI, private files, asynchronous work, mobile performance, internationalization, testability, and replaceable external providers.

The default is a production-oriented **TypeScript modular monolith**, not microservices. Add infrastructure only when a measured product or operational constraint justifies it.

## System context

```text
Browser / mobile web
        |
        | HTTPS, authenticated requests
        v
Next.js application (UI + server boundary)
        |
        +-- domain modules and authorization policies
        +-- PostgreSQL (business records and job state)
        +-- private object storage (source files)
        +-- background job adapter (document analysis/reminders)
        +-- AI provider adapter (structured analysis/grounded answers)
        +-- auth, email, billing and observability adapters
```

The Next.js application is the initial deployable unit. Provider interfaces keep domain logic independent of one storage, AI, queue, email, billing, analytics, or hosting vendor.

## Runtime and repository shape

The intended baseline is Next.js App Router, React, strict TypeScript, a supported Node.js LTS, pnpm, PostgreSQL, Prisma, schema validation, Tailwind CSS/design tokens, accessible primitives, Vitest, Playwright, and ESLint. Exact versions belong in the package manifest and lockfile after verification against current official security guidance.

Suggested organization:

```text
src/
  app/                 # routes, layouts, route handlers and composition
  components/          # genuinely shared UI primitives
  features/
    auth/
    onboarding/
    today/
    documents/
    actions/
    ai/
    search/
    notifications/
    billing/
    settings/
  lib/                 # narrow framework-independent utilities
  server/
    auth/              # session resolution and authorization policies
    db/                # database client and transaction helpers
    ai/                # provider adapter, schemas, prompts and metering
    storage/           # private-file adapter
    jobs/              # enqueue/process/idempotency boundaries
    observability/     # structured logs, tracing and safe error reporting
  styles/              # tokens and global styles
  types/               # shared types only when no feature owns them
prisma/                # schema, migrations and explicitly fictional seeds
tests/                 # integration/E2E support where colocating is unsuitable
```

Feature modules own their validation, domain operations, UI, and tests. `app/` composes them; it must not become the business-logic layer. Server and Client Components are chosen deliberately, with client boundaries limited to interactivity.

## Request and mutation boundary

Every server mutation follows the same sequence:

1. resolve the authenticated principal;
2. resolve the active workspace membership;
3. validate untrusted input at the server boundary;
4. authorize the operation against the actual record/workspace;
5. execute domain logic, using a transaction when invariants span records;
6. emit an audit/product event with no sensitive content;
7. return a typed, safe result and map expected errors consistently.

Client-supplied identifiers never establish ownership. Private reads must apply the same membership filter as mutations. Expected error classes distinguish validation, unauthenticated, forbidden, not found, conflict, rate limited, provider unavailable, and unexpected failures without leaking internal details.

## Domain and data model

PostgreSQL is the source of truth for business state. Use robust opaque identifiers, explicit foreign keys/cascade behavior, timestamps, unique constraints, and indexes that match authorization and sorting paths. Flexible JSON is reserved for genuinely versioned/provider-specific payloads, not used in place of core relations.

### Initial vertical-slice entities

- `User`, `Profile`, `Workspace`, and `WorkspaceMember` establish identity and tenancy.
- `Document` owns user-visible metadata, lifecycle, workspace, and soft operational state.
- `DocumentFile` records private object key, verified content type, size, hash, and storage provider metadata.
- `DocumentAnalysis` records validated results plus provider, model, prompt/schema version, processing time, warnings, and status.
- `ExtractedEntity` and `FinancialItem` hold queryable facts where relational behavior is useful.
- `ActionItem` records lifecycle, priority, deadline, source, confidence, and generation reason.
- `AuditEvent` records important metadata-only security/product changes.

### Later, when a delivered feature requires them

`Reminder`, `Notification`, `Conversation`, `Message`, `Subscription`, `UsageEvent`, `Integration`, and richer `Preference` records are introduced through migrations. Schema design preserves the Workspace boundary so a future household product does not require scattered ownership rewrites, but complex household permissions are explicitly post-MVP.

Money is represented in integer minor units or an appropriate exact decimal plus an ISO 4217 currency code—never floating point and never globally assumed to be SEK. Timestamps are stored in UTC; source timezone, all-day semantics, original date text, and confidence are preserved when needed to avoid ambiguous deadline conversion.

## Authentication and authorization

Authentication uses a mature maintained solution and server-validated sessions; password cryptography, token issuance, verification, and recovery are not hand-rolled. Social login and passkeys remain adapter-compatible rather than MVP blockers.

Authorization is centralized through helpers/policies such as `requireUser`, `requireWorkspace`, `requireWorkspaceRole`, `canReadDocument`, and `canDeleteDocument`. The default query shape includes the authorized workspace ID. Error behavior should not reveal whether another workspace's record exists.

The minimum security invariant is:

```text
session user -> active membership -> workspace-scoped query -> permitted record
```

Authorization filtering happens before private file URL generation, AI context construction, search/retrieval, exports, and destructive operations. The model, browser, and hidden UI controls are never authorization boundaries.

## Document ingestion and storage

Uploaded files are untrusted input. The server enforces authenticated ownership, byte-size limits, allowed extension/type, stronger content signature validation where practical, rate limits, and safe generated object names. Source filenames are metadata only and never storage paths. Files are never executed or served as active public content.

Business logic depends on a private storage interface approximately shaped as:

```ts
interface DocumentStorage {
  upload(input: UploadInput): Promise<StoredObject>;
  getSignedDownloadUrl(key: string, options: SignedUrlOptions): Promise<string>;
  delete(key: string): Promise<void>;
  getMetadata(key: string): Promise<StoredObjectMetadata>;
}
```

A local development adapter may be used behind the same interface. Production uses private object storage and short-lived, authorization-gated access. Database metadata and binary data are separate. Deletion coordinates the source object, analysis/derivatives, search artifacts, and related records according to an explicit retention policy while retaining only justified, non-content audit metadata.

A cryptographic content hash may detect accidental duplicate uploads and control re-analysis cost, but must not merge distinct records solely from similar metadata.

## Document processing

The persisted lifecycle is explicit:

```text
UPLOADED -> QUEUED -> PROCESSING -> READY
                              \-> NEEDS_REVIEW
                              \-> FAILED
```

The upload request stores the document and enqueues work; it does not hold a browser request open for model processing. The job processor:

1. claims an eligible document with an idempotency key;
2. reads the authorized private object;
3. extracts only the input needed for analysis;
4. calls the AI adapter with document content isolated as untrusted data;
5. validates and normalizes the structured result;
6. transactionally stores versioned analysis, facts, provenance, and deduplicated actions;
7. advances the document state and emits an appropriate notification/event.

Retries must not duplicate analyses, actions, notifications, or usage charges. Failed and low-confidence outcomes remain inspectable and retryable; they never leave the UI frozen. A development job adapter may run locally, but production processing must survive request termination and support retry/backoff.

## AI architecture

All model access lives behind a dedicated provider/domain layer with operations such as document analysis and grounded question answering. Raw SDK calls do not appear throughout routes or components.

Key rules:

- Model output uses a versioned schema and is validated server-side before persistence.
- The prompt separates system policy, application instructions, user intent, and retrieved document data.
- Text inside a document is data, including instructions such as “ignore previous instructions.”
- CIVORA never follows document links, executes embedded code, or takes external action because a document requested it.
- Important dates, amounts, organizations, obligations, and actions carry confidence and compact provenance when technically available.
- Low-confidence or conflicting values produce review warnings rather than confident facts.
- Provider/model, schema/prompt version, timing, failure class, and cost/usage metadata are retained without logging sensitive prompt bodies.
- Only the minimum required content is disclosed to a provider under documented retention settings.

Grounded CIVORA AI follows `authenticate -> authorize -> retrieve -> answer -> cite`. Retrieval is workspace-scoped before any context reaches the model. Exact high-stakes facts must not rely only on semantic similarity. Conversation history is bounded/summarized intentionally rather than resent without limit.

## Search

MVP search starts with PostgreSQL-backed title, organization, category, date, and available extracted text/metadata, always filtered by workspace. Add a separate, versioned embedding index only after grounded assistant quality or measured search needs justify it. Any semantic index must preserve document/workspace IDs, support rebuilding, and apply authorization before model context construction.

## UI, design, accessibility, and i18n

The visual system uses semantic tokens for both intentionally designed light and dark themes. It should feel calm, trustworthy, precise, premium, human, minimal, and slightly futuristic—not like a generic dashboard. Typography, whitespace, controlled surfaces, semantic urgency colors, and subtle stateful motion establish hierarchy; not every item becomes a card.

English and Swedish strings live in namespaced locale resources. Adding Arabic, Danish, German, or other languages must not require component rewrites. Layouts tolerate expansion and directionality. Translation, summary, explanation, and source text remain distinct domain concepts.

Target WCAG 2.2 AA where practical: semantic HTML, full keyboard operation, visible focus, accessible dialogs/forms/errors, sufficient contrast, screen-reader status announcements, large touch targets, and reduced-motion behavior. Mobile navigation and information layout are designed independently rather than compressed from desktop tables.

## Notifications, billing, and integrations

Business notifications are persisted domain events (for example `DOCUMENT_READY` or `ACTION_DUE_SOON`), separate from ephemeral UI toasts. Delivery channels and user preferences are adapters added as delivered milestones; timezone-aware scheduling and deduplication are mandatory.

Billing follows core-value validation. Stripe, when implemented, is a server-side adapter with centralized plan configuration, verified signed webhooks, idempotent event handling, persisted subscription state, and server-enforced usage limits. Browser success pages are not authoritative.

External integrations use least-privilege OAuth scopes, revocation, provider-specific adapters, and explicit user consent. No integration appears functional before a legitimate API path exists.

## Privacy, audit, and observability

Structured logs use request/correlation IDs and redact tokens, credentials, document content, personal data, complete AI prompts, and signed URLs. Operational telemetry records durations, status classes, job failures, provider usage, and safe identifiers. Product analytics uses an abstraction and never includes sensitive document content.

Important events such as upload, analysis, deletion, action completion, subscription changes, export requests, and account deletion are auditable using minimal metadata. Audit records are not a shadow copy of user documents.

Privacy flows must ultimately support visibility, export, document deletion, account deletion, and integration revocation. Legal surfaces describe actual processing and remain marked for professional review until that review occurs.

## Caching and performance

Private authenticated data is not shared across users through framework or CDN caches. Cache policy must be explicit at private route boundaries. Optimize meaningful bottlenecks: client JavaScript, fonts/images, query/index patterns, waterfalls, previews, model payloads, and response size. Expensive analysis is job-driven, not triggered on page render.

## Testing and quality gates

- **Unit:** validation, deadline prioritization, currency/date normalization, billing limits, AI result normalization, and other deterministic domain rules.
- **Integration:** workspace policies, database constraints/transactions, document lifecycle, idempotent action creation, storage failure compensation, deletion, and webhook processing.
- **End-to-end:** account/session, onboarding, upload, progressive processing, document review, generated action on Today, action completion, search, deletion, and protected-route behavior.
- **Security:** cross-workspace read/mutation/file/search/AI tests, hostile upload validation, prompt-injection fixtures, rate limits, CSRF/session behavior, and safe production errors.
- **Accessibility/responsive:** keyboard and assistive semantics plus representative phone, tablet, and desktop layouts, empty/loading/error/long-content/localized states.

Every stable milestone must pass lint, strict typecheck, relevant tests, and production build. Critical user flows gain E2E coverage before they become release gates.

## Deployment shape

The initial production shape is one Next.js deployment, managed PostgreSQL, private object storage, a durable background worker/job service, a mature auth provider/adapter, an AI provider, transactional email, and error monitoring. Billing is added when monetization is delivered. Provider names and exact runbooks remain deployment decisions; unavailable credentials do not justify fake production services.

Environment configuration is schema-validated at startup and separated by environment. Secrets are server-only, never committed, never exposed through public environment variables, and rotated after suspected disclosure. Preview environments must not accidentally use production data or callbacks.

## Decision record

| Decision                                                               | Status             | Reason                                                                                             |
| ---------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| TypeScript modular monolith and Next.js App Router                     | Accepted direction | Fast vertical delivery with clear server boundaries and one operable deployable.                   |
| PostgreSQL as business source of truth                                 | Accepted direction | Transactions, relational integrity, authorization-friendly queries, and strong future portability. |
| Workspace as tenant boundary from MVP                                  | Accepted direction | Prevents scattered user ownership checks and preserves a path to CIVORA Family.                    |
| Private object storage behind an adapter                               | Accepted direction | Sensitive binaries remain private and provider choice stays replaceable.                           |
| Asynchronous, idempotent document analysis                             | Accepted direction | Model work can retry and outlive browser/server requests without duplicate effects.                |
| Schema-validated, versioned AI results with provenance                 | Accepted direction | Makes probabilistic output reviewable, testable, and safely reprocessable.                         |
| Lexical/relational search before vector infrastructure                 | Accepted direction | Avoids speculative complexity while preserving a path to grounded retrieval.                       |
| Human confirmation for consequential external actions                  | Non-negotiable     | Protects user agency and reduces high-stakes automation risk.                                      |
| English and Swedish through an i18n layer                              | Accepted direction | Meets initial market needs without country-specific platform coupling.                             |
| Provider adapters for AI, jobs, storage, email, billing, and analytics | Accepted direction | Keeps domain behavior testable and avoids vendor logic across features.                            |

When implementation changes one of these decisions, update this table and explain the migration rather than allowing documentation and code to drift.
