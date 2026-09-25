# CIVORA release checklist

Use this checklist for the authenticated service. The public fictional preview is a separate milestone. An unchecked box is a release blocker, not proof that the feature is absent from the code. Record evidence without secrets or document content.

## Release record

| Field       | Required evidence                                                                    |
| ----------- | ------------------------------------------------------------------------------------ |
| Candidate   | Exact commit SHA and reviewed pull request                                           |
| CI          | Link to passing quality, database-integration and critical-path-e2e jobs on that SHA |
| Environment | Target origin, database branch and private bucket identifiers                        |
| Operator    | Person responsible for rollout and incident response                                 |
| Recovery    | Last verified backup and isolated restore drill; previous compatible app version     |
| Decision    | Date, approve/hold, and unresolved blockers                                          |

Latest verified code checkpoint: `bec8493586623aeaa3ec570937cf48d0481d2070`, [CI run 36093521385](https://github.com/Mohammed001200/MyProject-2026/actions/runs/36093521385). All three jobs passed, including desktop/mobile flows using deterministic test AI. This is not live-provider evidence.

## Before enabling real accounts and documents

- [ ] Review the release PR and confirm all required CI checks pass for the exact candidate.
- [ ] Configure a production PostgreSQL database and verify encrypted connectivity and restricted access.
- [ ] Complete an isolated backup/restore drill using [OPERATIONS.md](OPERATIONS.md). Record recovery time and data loss window actually demonstrated.
- [ ] Review pending migrations, take a recoverable backup, and apply `corepack pnpm db:deploy` against the intended target. Never use `db:migrate`, `db:seed`, or a database reset in production.
- [ ] Configure authentication with a unique 32+ character `BETTER_AUTH_SECRET` and the exact HTTPS `BETTER_AUTH_URL`. Set `NEXT_PUBLIC_APP_URL` to the same public origin.
- [ ] Configure `CIVORA_STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_REGION`, and credentials through the host's secret manager or default credential chain. Add the optional endpoint/path-style values only when required by the provider.
- [ ] Verify private access, encryption, required object read/write/delete permissions, and `GetBucketVersioning`. The live bucket must NEVER have enabled versioning; suspended versioning is incompatible too.
- [ ] Decide backup retention and deletion handling before retaining copies. Do not add expiry rules that remove live source objects while their database records remain active.
- [ ] Configure `CIVORA_AI_DRIVER=openai`, `OPENAI_API_KEY`, and an explicit available `OPENAI_MODEL`. Confirm model access and an approved spending limit.
- [ ] Ensure `CIVORA_INTEGRATION_TESTS` and `CIVORA_E2E_DATABASE` are unset in production. Never enable test drivers to make a failed live check pass.
- [ ] Configure separate random 32+ character `CIVORA_JOB_SECRET` and `CRON_SECRET` values. Verify the external worker actually runs; the daily recovery sweep alone is not a prompt-processing guarantee.
- [ ] Configure monitoring and a responsible operator. Verify an alert reaches its intended destination using a controlled failure.
- [ ] Resolve account recovery/email verification, account deletion/export, support contact and privacy/subprocessor disclosures before opening the intended beta. Obtain appropriate review; code tests do not establish legal readiness.

## Live acceptance test

Use invented documents and two dedicated accounts. Record pass/fail, candidate SHA, environment and date; do not attach prompts, secrets, session cookies or personal documents to the PR.

1. Sign up, complete onboarding, sign out and sign back in. Reload saved preferences.
2. Upload an invented supported PDF or image within the 4 MB limit. Verify the private object cannot be retrieved anonymously.
3. Confirm durable processing reaches READY or an honest NEEDS_REVIEW result through the configured worker, including after an app restart. Confirm an actual model was called.
4. Compare summary, dates, source excerpts and generated actions with the original. Treat unsupported facts or fabricated citations as failures. Include Swedish text, ambiguous dates and a document with no required action.
5. Ask document-specific chat questions, an unanswered question, and a question containing misleading instructions. Check source grounding, safe insufficient-evidence behavior, saved history after reload, and the saved language/style preference.
6. Verify the second account cannot retrieve the first account's document, source, actions or chat; test both reads and mutations.
7. Complete, reopen, dismiss and manually edit an action. Check due dates around midnight in the saved time zone.
8. Clear chat history and reload. Delete the source, verify source/analysis/actions/chat are inaccessible, and confirm object deletion completes. Exercise the deferred deletion path in an isolated environment with storage temporarily unavailable.
9. Verify missing/incorrect worker authorization is rejected. Verify authenticated processing/deletion counts and subsequent recovery after a temporary failure.
10. Repeat the critical journey on a phone and desktop using keyboard-only navigation where applicable. Check focus, errors, loading states and layout.

## Rollout decision

- [ ] Live checks above pass, with discrepancies resolved and evidence recorded.
- [ ] Restore and rollback procedures are rehearsed; the recovery owner is available.
- [ ] Actual infrastructure and provider costs are understood; billing is not represented as active until implemented and tested.
- [ ] User-facing claims match implemented behavior. Streaming, cross-document chat, full localization and other roadmap gaps are not advertised as delivered.
- [ ] Approve the release explicitly, publish the reviewed version, and repeat signup/upload/chat/delete smoke checks on its final origin.

If any gate fails, retain the fictional preview and hold authenticated launch. Do not mark this checklist complete just because a deployment reports Ready.
