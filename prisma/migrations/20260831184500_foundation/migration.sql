-- CIVORA foundation: authentication, tenant boundary, document intelligence,
-- action lifecycle, and append-only audit metadata.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "WorkspaceKind" AS ENUM ('PERSONAL', 'HOUSEHOLD');
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "ExplanationStyle" AS ENUM ('SIMPLE', 'BALANCED', 'DETAILED');
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'QUEUED', 'PROCESSING', 'READY', 'NEEDS_REVIEW', 'FAILED');
CREATE TYPE "DocumentCategory" AS ENUM ('GOVERNMENT', 'FINANCE', 'INSURANCE', 'HOUSING', 'EMPLOYMENT', 'EDUCATION', 'HEALTH_ADMIN', 'CONTRACT', 'INVOICE', 'OTHER');
CREATE TYPE "AnalysisStatus" AS ENUM ('PROCESSING', 'READY', 'NEEDS_REVIEW', 'FAILED');
CREATE TYPE "Importance" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'COMPLETED', 'DISMISSED');
CREATE TYPE "ActionPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "FinancialItemType" AS ENUM ('INVOICE', 'PAYMENT', 'RENEWAL', 'RECURRING_COST', 'OTHER');
CREATE TYPE "DocumentJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'RETRY', 'READY', 'FAILED');

CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" UUID NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "issuer" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profile" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "userId" UUID NOT NULL,
    "preferredLocale" VARCHAR(12) NOT NULL DEFAULT 'en',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "explanationStyle" "ExplanationStyle" NOT NULL DEFAULT 'BALANCED',
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profile_onboardingStep_check" CHECK ("onboardingStep" >= 0)
);

CREATE TABLE "workspace" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "WorkspaceKind" NOT NULL DEFAULT 'PERSONAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_member" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "organizationName" TEXT,
    "documentDate" TIMESTAMP(3),
    "sourceDateText" TEXT,
    "language" VARCHAR(16),
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_file" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "storageProvider" VARCHAR(32) NOT NULL,
    "objectKey" TEXT NOT NULL,
    "verifiedMimeType" VARCHAR(128) NOT NULL,
    "extension" VARCHAR(12) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_file_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "document_file_sizeBytes_check" CHECK ("sizeBytes" > 0),
    CONSTRAINT "document_file_sha256_check" CHECK ("sha256" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "document_job" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "status" "DocumentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" VARCHAR(96),
    "lastErrorCode" VARCHAR(96),
    "lastErrorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_job_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "document_job_attempts_check" CHECK ("attempts" >= 0)
);

CREATE TABLE "document_analysis" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
    "provider" VARCHAR(64) NOT NULL,
    "model" VARCHAR(128) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "promptVersion" VARCHAR(32) NOT NULL,
    "summary" TEXT,
    "simpleExplanation" TEXT,
    "detectedLanguage" VARCHAR(16),
    "importance" "Importance" NOT NULL DEFAULT 'NORMAL',
    "confidence" DECIMAL(4,3),
    "warnings" JSONB,
    "normalizedPayload" JSONB,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "document_analysis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "document_analysis_version_check" CHECK ("version" > 0),
    CONSTRAINT "document_analysis_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)),
    CONSTRAINT "document_analysis_tokens_check" CHECK (("inputTokens" IS NULL OR "inputTokens" >= 0) AND ("outputTokens" IS NULL OR "outputTokens" >= 0))
);

CREATE TABLE "extracted_entity" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "analysisId" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "confidence" DECIMAL(4,3),
    "pageNumber" INTEGER,
    "sourceText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "extracted_entity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "extracted_entity_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)),
    CONSTRAINT "extracted_entity_pageNumber_check" CHECK ("pageNumber" IS NULL OR "pageNumber" > 0)
);

CREATE TABLE "financial_item" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "analysisId" UUID NOT NULL,
    "type" "FinancialItemType" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "confidence" DECIMAL(4,3),
    "pageNumber" INTEGER,
    "sourceText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financial_item_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_item_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "financial_item_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)),
    CONSTRAINT "financial_item_pageNumber_check" CHECK ("pageNumber" IS NULL OR "pageNumber" > 0)
);

CREATE TABLE "action_item" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "createdById" UUID,
    "sourceDocumentId" UUID,
    "sourceAnalysisId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ActionPriority" NOT NULL DEFAULT 'NORMAL',
    "dueAt" TIMESTAMP(3),
    "dueDateIsAllDay" BOOLEAN NOT NULL DEFAULT true,
    "sourceDateText" TEXT,
    "completedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "confidence" DECIMAL(4,3),
    "generationReason" TEXT,
    "generationKey" TEXT,
    "sourcePageNumber" INTEGER,
    "sourceText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "action_item_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "action_item_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)),
    CONSTRAINT "action_item_sourcePageNumber_check" CHECK ("sourcePageNumber" IS NULL OR "sourcePageNumber" > 0),
    CONSTRAINT "action_item_lifecycle_check" CHECK (
      ("status" = 'OPEN' AND "completedAt" IS NULL AND "dismissedAt" IS NULL) OR
      ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL AND "dismissedAt" IS NULL) OR
      ("status" = 'DISMISSED' AND "dismissedAt" IS NOT NULL AND "completedAt" IS NULL)
    )
);

CREATE TABLE "audit_event" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "workspaceId" UUID,
    "actorUserId" UUID,
    "eventType" VARCHAR(96) NOT NULL,
    "entityType" VARCHAR(64),
    "entityId" TEXT,
    "requestId" VARCHAR(96),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account"("issuer", "accountId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");
CREATE UNIQUE INDEX "workspace_slug_key" ON "workspace"("slug");
CREATE INDEX "workspace_member_userId_idx" ON "workspace_member"("userId");
CREATE UNIQUE INDEX "workspace_member_workspaceId_userId_key" ON "workspace_member"("workspaceId", "userId");
CREATE INDEX "document_workspaceId_status_createdAt_idx" ON "document"("workspaceId", "status", "createdAt" DESC);
CREATE INDEX "document_workspaceId_category_documentDate_idx" ON "document"("workspaceId", "category", "documentDate" DESC);
CREATE INDEX "document_uploadedById_idx" ON "document"("uploadedById");
CREATE UNIQUE INDEX "document_file_documentId_key" ON "document_file"("documentId");
CREATE UNIQUE INDEX "document_file_objectKey_key" ON "document_file"("objectKey");
CREATE INDEX "document_file_sha256_idx" ON "document_file"("sha256");
CREATE UNIQUE INDEX "document_job_documentId_key" ON "document_job"("documentId");
CREATE INDEX "document_job_status_availableAt_idx" ON "document_job"("status", "availableAt");
CREATE INDEX "document_analysis_documentId_status_idx" ON "document_analysis"("documentId", "status");
CREATE UNIQUE INDEX "document_analysis_documentId_version_key" ON "document_analysis"("documentId", "version");
CREATE INDEX "extracted_entity_analysisId_type_idx" ON "extracted_entity"("analysisId", "type");
CREATE INDEX "financial_item_analysisId_idx" ON "financial_item"("analysisId");
CREATE INDEX "financial_item_currency_dueAt_idx" ON "financial_item"("currency", "dueAt");
CREATE INDEX "action_item_workspaceId_status_dueAt_idx" ON "action_item"("workspaceId", "status", "dueAt");
CREATE INDEX "action_item_sourceDocumentId_idx" ON "action_item"("sourceDocumentId");
CREATE INDEX "action_item_sourceAnalysisId_idx" ON "action_item"("sourceAnalysisId");
CREATE INDEX "action_item_createdById_idx" ON "action_item"("createdById");
CREATE UNIQUE INDEX "action_item_workspaceId_generationKey_key" ON "action_item"("workspaceId", "generationKey");
CREATE INDEX "audit_event_workspaceId_createdAt_idx" ON "audit_event"("workspaceId", "createdAt" DESC);
CREATE INDEX "audit_event_actorUserId_createdAt_idx" ON "audit_event"("actorUserId", "createdAt" DESC);
CREATE INDEX "audit_event_eventType_createdAt_idx" ON "audit_event"("eventType", "createdAt" DESC);

ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document" ADD CONSTRAINT "document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document" ADD CONSTRAINT "document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_file" ADD CONSTRAINT "document_file_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_job" ADD CONSTRAINT "document_job_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_analysis" ADD CONSTRAINT "document_analysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extracted_entity" ADD CONSTRAINT "extracted_entity_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "document_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_item" ADD CONSTRAINT "financial_item_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "document_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_sourceAnalysisId_fkey" FOREIGN KEY ("sourceAnalysisId") REFERENCES "document_analysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
