# CIVORA Security

> Status: founding threat model and engineering policy. CIVORA is not yet approved for real sensitive documents. Current UI fixtures are fictional and local preview interactions do not provide production security.

## Security objectives

1. A user can access only records and files owned by an authorized workspace membership.
2. Source documents remain private in storage and transit.
3. Untrusted files and document text cannot change application or model policy.
4. Probabilistic extraction cannot silently become a high-stakes fact or external action.
5. Secrets, tokens, personal content, prompts, signed URLs, and payment data do not leak through client bundles, logs, analytics, errors, or Git.
6. Deletion and export have explicit, auditable semantics.

## Assets and trust boundaries

Sensitive assets include identity/session data, workspace membership, original documents, extracted text/facts, actions, conversations, payment/subscription state, audit metadata, encryption/storage credentials, and AI-provider inputs.

Trust boundaries exist between the browser and Next.js server, server and PostgreSQL, server/worker and object storage, job producer and worker, application and AI provider, application and auth/email/billing providers, and tenant workspaces. Browsers, uploaded bytes, filenames/MIME headers, model output, webhook bodies, URL IDs, and document instructions are untrusted.

## Principal threats and required controls

| Threat                                 | Required controls before beta                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDOR / cross-workspace access          | Server-resolved session and membership; workspace-scoped queries; record-level policies; negative integration tests.                                  |
| Public or guessed document URL         | Private bucket/local directory outside public assets; opaque generated keys; authorization before short-lived signed access.                          |
| Malicious upload                       | Allowlist, byte limit, extension/MIME/signature agreement, safe filename metadata, no execution/active serving, rate limits, malware strategy review. |
| Prompt injection in documents          | Treat content as delimited data; fixed higher-priority policy; no link/code execution; structured schema validation; human confirmation.              |
| Hallucinated dates/amounts/obligations | Confidence, original representation, provenance, server normalization, review state, cautious copy, source always available.                          |
| Session/CSRF/brute force               | Mature auth library, secure cookies, origin/CSRF controls as applicable, verification/recovery flows, rate limits, protected-route tests.             |
| XSS / unsafe rendering                 | React escaping, no untrusted HTML, restrictive content handling and headers, safe document preview strategy.                                          |
| SQL injection                          | Parameterized type-safe client, server validation, least-privilege DB credentials.                                                                    |
| Duplicate jobs/webhooks                | Durable idempotency keys and uniqueness constraints; transactional state transitions; signed Stripe webhooks.                                         |
| Sensitive logging/analytics            | Structured allowlisted fields, correlation IDs, redaction, no document bodies or complete prompts, retention limits.                                  |
| Dependency compromise                  | Lockfile, registry/supply-chain checks, CI audit/review, patched stable versions, minimal dependencies.                                               |

## Current implemented controls

- Strict TypeScript, shared client-side file policy, and unit coverage for file type/size and attention priority.
- Explicit fictional/demo labeling and local-only upload interaction.
- No committed credentials, AI calls, file upload endpoint, public source files, or billing path.
- Baseline security headers: content-type sniffing prevention, clickjacking denial, strict referrer policy, browser capability restrictions, and opener isolation.
- Private app preview pages are marked `noindex`.
- Reduced-motion support and accessible labels on current controls.
- Better Auth with 12-character minimum passwords, secure production cookies, origin controls, rate limits, safe auth errors, and no committed secrets.
- Workspace membership as the tenant boundary, centralized non-enumerating record policies, idempotent personal-workspace creation, and metadata-only bootstrap audit events.
- PostgreSQL migration constraints plus isolated CI tests for real signup/signin and cross-workspace denial.

These controls do not make the application safe for personal documents; they merely reduce risk in the preview milestone.

## Mandatory gates before real uploads

- Mature authentication and verified server session handling.
- Workspace membership model plus cross-tenant read/write/delete/file tests.
- PostgreSQL migrations, constraints, transactions, and safe error mapping.
- Private storage adapter with server-side byte-signature validation and authenticated download.
- Rate limits, upload quotas, secure generated keys, lifecycle cleanup, and audit events.
- Durable job interface with idempotent analysis and failure/retry states.
- Content Security Policy designed and tested for the chosen deployment/runtime.
- Dependency and secret scans in CI; production logging and error redaction review.

## AI-specific policy

Use the official SDK through one server-only adapter. Model calls must use a versioned schema and server validation. Separate system policy, application instruction, user intent, and document data. Store provider/model/schema/prompt version and safe usage metadata. Minimize content sent to the provider and document retention/data-residency assumptions. Never rely on the model to enforce authorization or execute consequential external actions.

## Privacy and deletion

Define retention for originals, derived text, analysis, job payloads, backups, logs, and provider data before beta. Document deletion must coordinate the object, database records, derived search/AI artifacts, and justified non-content audit metadata. Account deletion and export require authenticated, rate-limited, auditable workflows.

## Vulnerability reporting

No public vulnerability-reporting inbox exists yet. Establish a monitored security contact and coordinated disclosure policy before inviting beta users. Do not include vulnerabilities or sensitive reproduction data in a public issue.
