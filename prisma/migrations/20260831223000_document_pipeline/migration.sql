-- Add the durable document-processing boundary and action provenance without
-- changing the already-published foundation migration.

CREATE TYPE "DocumentJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'RETRY', 'READY', 'FAILED');

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

ALTER TABLE "action_item"
    ADD COLUMN "sourcePageNumber" INTEGER,
    ADD COLUMN "sourceText" TEXT,
    ADD CONSTRAINT "action_item_sourcePageNumber_check"
        CHECK ("sourcePageNumber" IS NULL OR "sourcePageNumber" > 0);

CREATE UNIQUE INDEX "document_job_documentId_key" ON "document_job"("documentId");
CREATE INDEX "document_job_status_availableAt_idx" ON "document_job"("status", "availableAt");

ALTER TABLE "document_job"
    ADD CONSTRAINT "document_job_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "document"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
