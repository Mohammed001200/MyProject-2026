# CIVORA Product Definition

> Status: founding product direction. This document defines intended behavior and scope; it does not claim that features are implemented. See `ROADMAP.md` for delivery status.

## Product promise

CIVORA is a personal life-administration operating system. It turns important documents and messages into understandable facts, prioritized actions, and timely reminders.

> Tell me what matters. Explain it. Remember it. Help me do it.

CIVORA is not a file drive and is not a generic chatbot. Its value is the trusted path from raw information to a completed action.

## Initial user and problem

The initial product serves adults who manage personal administration digitally, especially people who handle many PDFs, bills, contracts, renewals, government-style letters, employment or education documents, and multiple languages.

The first geographic context may be Sweden, with English and Swedish UI, but the domain model must remain country-neutral. Swedish organizations, currency, date formats, and public-sector concepts are examples of data—not platform primitives.

Users need CIVORA to answer quickly:

- What needs my attention now?
- What is due or expiring soon?
- What must I pay, submit, cancel, or review?
- What changed, and where is the evidence?
- Which document contains a fact I need?
- What did I complete recently?

## Product principles

1. **Action over storage.** A document should become useful information, not merely a stored file.
2. **Evidence over hallucination.** Consequential facts must lead back to the original document and, where practical, the relevant page or excerpt.
3. **Calm over complexity.** Prioritize what matters; avoid arbitrary metrics, card grids, and administrative clutter.
4. **User control over autonomous action.** CIVORA may analyze, recommend, organize, and prepare. A person confirms consequential or irreversible external actions.
5. **Uncertainty is visible.** Low-confidence dates, amounts, obligations, and entities require review; the UI must not turn estimates into facts.
6. **Privacy by design.** Minimize collection, provider disclosure, logs, and retention of sensitive information.
7. **Mobile is a primary surface.** Every core flow must be intentionally designed for touch and small screens.
8. **Progressive intelligence.** The product becomes more useful as authorized information accumulates without assuming access the user did not grant.
9. **Honest product language.** Use calm, concrete claims. Never imply legal, medical, financial, governmental, banking, or integration authority that CIVORA does not have.

## Core value loop

The MVP must prove one coherent flow:

1. A person creates an account and a personal workspace.
2. They choose a language and upload an important PDF or image.
3. CIVORA securely stores the file and visibly progresses through analysis.
4. CIVORA classifies the document, explains it simply, and extracts important facts.
5. Dates, amounts, actions, confidence, and source evidence are shown for review.
6. A useful action appears on Today.
7. The person completes, reopens, edits, or dismisses that action and can always return to the source.
8. They can find the document later and delete it when no longer wanted.

The loop is successful only with real persisted data and real analysis. Fictional fixtures may demonstrate development states but must be clearly labeled and never count as production capability.

## Primary information architecture

- **Today:** the home and prioritization surface—needs attention, upcoming, recently understood, completed, and a reassuring quiet state.
- **Inbox:** newly uploaded or ingested information and its processing/review state.
- **Actions:** user-created and AI-suggested work with status, priority, due date, and source linkage.
- **Documents:** private searchable records optimized around meaning rather than folders.
- **CIVORA AI:** a later, grounded assistant over the current workspace's authorized documents and actions.
- **Settings:** profile, language, notification preferences, privacy controls, integrations, and billing as those capabilities become real.
- **Money and Calendar:** later views unlocked by useful structured obligations and deadlines, not placeholder navigation.

## Core product behavior

### Today

Today is not a statistics dashboard. It should answer “what should I do?” within seconds. Urgency, meaning, next action, and source context outrank decorative density. Every populated, first-use, empty, loading, offline/error, and completion state requires deliberate design.

### Documents

MVP accepts PDF, JPG, JPEG, and PNG within documented size limits. Each document has an explicit lifecycle:

`UPLOADED → QUEUED → PROCESSING → READY | NEEDS_REVIEW | FAILED`

The detail experience progressively reveals the original file, sender/organization, date, category, summary, simple explanation, extracted facts, amounts, deadlines, actions, confidence, warnings, and provenance. The original remains accessible; an AI explanation never replaces it.

### Actions

An action has an owner/workspace, title, optional description, `OPEN | COMPLETED | DISMISSED` status, `LOW | NORMAL | HIGH | URGENT` priority, timestamps, an optional due date, and optional source-document/provenance/confidence metadata. Users can create, edit, complete, reopen, dismiss an AI suggestion, and navigate to its source.

### Search and CIVORA AI

MVP search covers titles, organizations, categories, dates, and available extracted metadata/text. Semantic retrieval is introduced only when it measurably improves grounded questions.

CIVORA AI is not an open-ended chat wrapper. It authenticates and authorizes every retrieval, answers from workspace-owned sources, distinguishes facts from assumptions, links evidence, handles empty results honestly, and limits conversation context and cost.

## Language and high-stakes content

Initial UI languages are English and Swedish. User-facing strings belong in a maintained localization layer. Source language, translation, summary, and simple-language explanation are separate concepts and must remain distinguishable.

For legal, financial, insurance, health-administration, employment, or government-style content, prefer language such as “Based on the document…” or “The document appears to say…”. Users should verify consequential decisions against the source or an appropriate professional.

## MVP boundary

The MVP includes the landing experience, mature authentication, short onboarding, workspace isolation, secure document upload/storage, asynchronous document analysis, structured validated extraction, provenance/confidence, document library/detail/search, useful actions, and Today on desktop and mobile.

The following are not required to prove the first loop:

- household sharing or complex roles;
- banking balances, open banking, or financial advice;
- email/calendar/provider integrations without legitimate APIs and authorization;
- fully autonomous external actions;
- a native mobile application;
- graph infrastructure, microservices, or speculative enterprise systems;
- billing before users can experience the core value.

## Product success

### Activation

A new user uploads a document, receives a valid analysis, views at least one useful extracted fact or action, and understands what to do next.

### Retention and value

- Users return to review or complete actions.
- Generated actions are completed rather than routinely dismissed.
- Important documents are found again through search.
- Deadlines are surfaced before they are missed.
- Grounded AI answers resolve real questions with useful source links.

### Trust

- Users correct low-confidence values instead of being misled by them.
- Cross-workspace authorization tests remain green.
- Analysis/storage failures are visible, recoverable, and do not corrupt state.
- Deletion removes the source and defined derivatives according to policy.

Paid conversion matters only after activation, retention, and trust are demonstrated.

## Terminology

- **Workspace:** the authorization and data-ownership boundary. MVP creates a personal workspace; the model can later support households.
- **Document:** the user-visible record and lifecycle metadata for one uploaded source.
- **Document file:** the private binary object and storage metadata.
- **Analysis:** a versioned, schema-validated interpretation produced from a document.
- **Extracted fact:** a structured date, amount, entity, or other claim with confidence and provenance where available.
- **Action:** a task the user may complete, edit, reopen, or dismiss.
- **Provenance/evidence:** a compact pointer to the source document, page/location, and relevant excerpt where practical.
- **Today:** the prioritized command surface for current and upcoming work.
- **Notification:** a persisted business event presented through an allowed channel; it is not merely a transient toast.
- **Demo fixture:** fictional development-only data clearly separated from production user data.

## Product decision test

Before adding a capability, ask whether it materially improves activation, retained usage, trust, willingness to pay, operating cost, or defensibility. Prefer five exceptional working capabilities over ten unfinished ones, then continue to the next validated slice.
