# CIVORA operations runbook

These are procedures prepared from the current implementation. Live infrastructure, alerts and restore drills are not yet verified. Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) to record evidence before launch.

## Routine release

1. Identify the exact reviewed commit and passing CI run. Preserve the previous compatible application artifact.
2. Verify the target origin, database branch and bucket in the deployment system without printing credential values. Preview and production must not accidentally share test settings or data.
3. Confirm a recoverable backup exists and the isolated restore drill succeeded. Review migration SQL against the current schema and application compatibility.
4. In the release environment, install the locked dependencies, generate the client, then apply migrations:

   ```bash
   corepack pnpm install --frozen-lockfile
   corepack pnpm db:generate
   corepack pnpm db:deploy
   corepack pnpm build
   ```

   `DATABASE_URL` must already be securely configured. These commands do not configure storage, auth or AI providers. Stop on a failed migration; do not reset the database or mark a failed migration applied without reviewing what actually ran.

5. Deploy the built candidate, run the live acceptance checks and record the result. Enable the configured worker only against the intended environment.

## Job and deletion recovery

Endpoint: `/api/internal/jobs/documents`.

| Method | Required authorization              | Purpose                    |
| ------ | ----------------------------------- | -------------------------- |
| POST   | Bearer value of `CIVORA_JOB_SECRET` | External worker invocation |
| GET    | Bearer value of `CRON_SECRET`       | Daily recovery invocation  |

Missing/short configuration returns 503. Missing or incorrect authorization returns 401 when configuration is valid. The credentials are independent. Configure authorization in the scheduler's secret field, not a URL or pasted command history.

A successful response includes `processing` (selected, ready, retry, failed) and `deletions` (selected, deleted, failed). Each path selects five records by default. An HTTP 200 means the batch returned; it does not mean the backlog is empty or every selected item succeeded.

Current processing behavior:

- Eligible QUEUED/RETRY jobs require `availableAt` to have passed and no lock. PROCESSING locks older than 15 minutes may be reclaimed.
- Ordinary processing failures retry while the recorded attempt count is below three; the first retry delays are 30 and 60 seconds. Actual completion also depends on worker cadence.
- Missing AI configuration and source-integrity failures become terminal failures immediately. There is no supported administrative requeue interface yet.
- A worker that loses its lease cannot save its result. Do not manually clear live locks or duplicate generated actions to force progress.
- Deletion hides the record and removes analysis/chat/action derivatives before retrying object removal. Storage failure keeps a private tombstone and postpones the next attempt by five minutes.

When the queue stalls:

1. Check worker invocation time, HTTP status, safe response counts and infrastructure errors. Inspect identifiers and state only; do not collect source content, prompts or tokens in logs.
2. Resolve configuration, model quota, database or storage connectivity failures first. Check the bucket location and versioning policy if deletion fails.
3. Let the normal worker reclaim stale processing locks and eligible deletion tombstones. Monitor repeated batches until the backlog drains or stops improving.
4. Investigate terminal failures individually. Do not weaken source-integrity checks. A user may choose to upload a new copy after the underlying problem is fixed; that creates a new document and may incur another model call.
5. If storage cannot complete deletion, keep the tombstone and report deletion as pending. Never delete its last object locator or claim permanent removal prematurely.

## Chat failures

Chat is saved before a model request and the answer is persisted before delivery. A request ID prevents duplicate successful generation on ordinary retries. Recent pending requests block concurrent generation for that user; after two minutes they are displayed as failed. The current limit is 50 requested turns per rolling 24 hours and 40 turns per user/document conversation. Clearing history does not reset the daily audit-based limit.

For unavailable AI, inspect configuration and model access. For repeated failures, inspect safe error codes and provider status without copying user questions or responses into logs. A deleted conversation must stay deleted even if its model call finishes late. Do not manually recreate missing turns.

## Backup and isolated restore drill

Database backups and object copies must be planned together. Database-only recovery cannot recover a missing source file. The live source bucket's never-versioned requirement still applies; enabling versioning is not an acceptable backup shortcut for this adapter.

Before launch, choose a backup mechanism, retention, encryption and access policy. Define how deletion requests will be respected in retained backups. Record the actual restore procedure for the selected provider; no backup provider or deletion-ledger service is configured by this document.

Drill procedure:

1. Use an isolated environment with invented documents, saved chat and completed actions. Create one record to retain and one to delete after the backup point.
2. Capture the database recovery point and corresponding private object set. Record schema/application version and backup time without secrets.
3. Delete the second document through the app. Retain enough protected deletion evidence outside the rollback point to prevent resurrection during restore. Designing and testing that evidence retention is a launch gate.
4. Restore into a NEW isolated database and private bucket with external jobs and model calls disabled. Never test by overwriting production.
5. Reconcile restored data with subsequent deletion requests before allowing access. Confirm deleted source objects, analyses, actions and chat are absent or inaccessible. If reliable reconciliation is unavailable, keep the restored environment offline.
6. Verify memberships, source hashes, source availability, action state, preferences and private chat. Storage records bind to their original provider location: a different bucket needs a reviewed migration of those bindings, not just an environment-variable switch.
7. Invalidate restored sessions before any recovered production environment is opened. Resume workers only after stale jobs and deletion tombstones have been reviewed.
8. Record measured recovery time, data loss window, discrepancies and follow-up owner. Securely remove the drill environment and its copied data after review.

## Rollback and incidents

For a broken application release, prefer restoring the last known compatible application version while preserving the database. Confirm compatibility with applied migrations first. Do not run reverse schema changes or restore older data as an automatic rollback step.

For suspected unauthorized access or corrupted source data:

1. Restrict affected app access and pause affected workers using the host's controls. Preserve privacy-safe audit evidence and deployment identifiers.
2. Identify the scope: environment, time window, resource IDs, failed boundaries and credential exposure. Do not copy user content into public issues.
3. Revoke compromised credentials and sessions through the relevant systems, replace secrets securely, and verify old access no longer works. Secret rotation alone must not be assumed to invalidate every existing session.
4. Fix the cause on a branch and run the affected authorization/lifecycle tests plus full CI. Use the restore procedure only when necessary and only after deletion reconciliation is available.
5. Verify the live acceptance flow before reopening access. Record incident owner, timeline, mitigation, evidence and prevention work. Determine any required user communication with appropriate review; this document sends no notifications.

## Monitoring to configure

Track worker last-success time, eligible backlog age/count, processing failure counts, pending deletion age/count, auth/API failure rates and model usage. Keep content and credential values out of telemetry. Set thresholds from the actual service objective and worker cadence, then exercise each alert in isolation. No dashboard, alert destination or service-level guarantee is active merely because it is listed here.
