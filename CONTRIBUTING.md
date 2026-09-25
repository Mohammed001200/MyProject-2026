# Contributing to CIVORA

CIVORA uses a simple GitHub flow. The goal is a small, auditable history where
`main` always represents a tested release candidate.

## Branches

- Never develop directly on `main`, force-push it, or delete it.
- Start work from the latest green `main` unless an explicitly documented
  milestone branch is still awaiting its first merge.
- Use short-lived branches named `feat/...`, `fix/...`, `refactor/...`,
  `test/...`, `chore/...`, `docs/...`, or `security/...`.
- Do not add a permanent `develop` branch. Larger unfinished milestones may use
  a temporary milestone branch.
- Push a stable checkpoint before risky migrations, dependency changes, or
  broad refactors. Never rewrite a shared branch.

## Commits

Use focused Conventional Commits, for example:

```text
feat: extract document financial items
fix: serialize database-backed browser journeys
security: remediate vulnerable transitive dependency
docs: clarify production storage requirements
```

Review staged changes and run `git diff --check` before committing. Do not mix
unrelated work into a generic checkpoint commit.

## Required checks

Run the relevant local gates before pushing:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm audit --prod --audit-level=high
corepack pnpm build
```

GitHub must additionally pass `database-integration` and `critical-path-e2e`.
Never merge a known-red critical check.

## Pull requests

Open a pull request from the working branch to `main`. Use a draft while work
or required checks are incomplete. The description must explain what changed,
why, validation performed, security/privacy impact, and remaining known issues.

Before merge:

- every required CI job is green;
- the diff has been reviewed and conversations are resolved;
- migrations and provider changes include rollback or recovery considerations;
- no secret, personal document, local storage, test artifact, or generated
  sensitive file is tracked.

Prefer a squash merge for a focused branch and remove the merged branch. Tag
only a green commit already merged to `main`.

## Repository protection

Protect `main` with pull requests and the `quality`, `database-integration`, and
`critical-path-e2e` checks. Require conversation resolution and linear history,
and block force pushes and branch deletion. A solo-owner repository may begin
with zero mandatory external approvals so protection does not deadlock delivery;
add required reviewers when another maintainer joins.

## Secrets

Commit only documented variable names in `.env.example`; never commit values.
Keep `.env*`, private keys, local object storage, build output, coverage, and
browser artifacts ignored. If a credential enters Git history, stop pushing,
revoke and rotate it first, then follow an explicitly reviewed remediation plan.
