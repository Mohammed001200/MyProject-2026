CREATE TABLE "chat_turn" (
  "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "analysisId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "question" VARCHAR(2000) NOT NULL,
  "answer" TEXT,
  "citations" JSONB,
  "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  "provider" VARCHAR(64),
  "model" VARCHAR(128),
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "estimatedCostUsd" DECIMAL(12,8),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "chat_turn_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_turn_status_check" CHECK ("status" IN ('PENDING', 'COMPLETE', 'FAILED')),
  CONSTRAINT "chat_turn_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chat_turn_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "document_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chat_turn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "chat_turn_userId_requestId_key" ON "chat_turn"("userId", "requestId");
CREATE INDEX "chat_turn_documentId_userId_createdAt_idx" ON "chat_turn"("documentId", "userId", "createdAt");
CREATE INDEX "chat_turn_userId_createdAt_idx" ON "chat_turn"("userId", "createdAt");
