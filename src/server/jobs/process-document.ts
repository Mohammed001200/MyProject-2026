import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import {
  AnalysisConfigurationError,
  getDocumentAnalysisProvider,
} from "@/server/ai/provider";
import { applyAnalysisSafetyPolicy } from "@/server/ai/safety-policy";
import { getPrisma } from "@/server/db/prisma";
import {
  assertDocumentSourceIntegrity,
  DocumentSourceIntegrityError,
} from "@/server/documents/source-integrity";
import { getDocumentStorage } from "@/server/storage";
import { assertDocumentStorageProvider } from "@/server/storage/types";

function atNoonUtc(value: string | null) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const MAX_PROCESSING_ATTEMPTS = 3;
const STALE_JOB_LOCK_MS = 15 * 60 * 1000;

class DocumentJobLeaseLostError extends Error {
  constructor() {
    super("The document job lease is no longer owned by this worker.");
    this.name = "DocumentJobLeaseLostError";
  }
}

function staleBefore(now: Date) {
  return new Date(now.getTime() - STALE_JOB_LOCK_MS);
}

function retryAt(attempts: number) {
  const delayMs = Math.min(30_000 * 2 ** Math.max(0, attempts - 1), 300_000);
  return new Date(Date.now() + delayMs);
}

export async function processDocument(documentId: string) {
  const prisma = getPrisma();
  const workerId = `next-after-${randomUUID()}`;
  const now = new Date();
  let failureAuditContext: {
    workspaceId: string;
    actorUserId: string;
  } | null = null;

  const claim = await prisma.documentJob.updateMany({
    where: {
      documentId,
      OR: [
        {
          status: { in: ["QUEUED", "RETRY"] },
          availableAt: { lte: now },
          lockedAt: null,
        },
        {
          status: "PROCESSING",
          lockedAt: { lte: staleBefore(now) },
        },
      ],
    },
    data: {
      status: "PROCESSING",
      lockedAt: now,
      lockedBy: workerId,
      attempts: { increment: 1 },
    },
  });

  if (claim.count !== 1) return { status: "not-claimed" as const };
  const claimedJob = await prisma.documentJob.findUniqueOrThrow({
    where: { documentId },
    select: { attempts: true },
  });

  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
      include: { file: true },
    });

    if (!document.file) throw new Error("Document file metadata is missing");
    failureAuditContext = {
      workspaceId: document.workspaceId,
      actorUserId: document.uploadedById,
    };

    const storage = getDocumentStorage();
    assertDocumentStorageProvider(storage, document.file.storageProvider);
    const bytes = await storage.read(document.file.objectKey);
    assertDocumentSourceIntegrity(bytes, document.file);
    const analysis = await getDocumentAnalysisProvider().analyze({
      bytes,
      mimeType: document.file.verifiedMimeType as
        "application/pdf" | "image/jpeg" | "image/png",
      extension: document.file.extension as "pdf" | "jpg" | "jpeg" | "png",
    });
    const safety = applyAnalysisSafetyPolicy(analysis.result);

    await prisma.$transaction(async (transaction) => {
      const lease = await transaction.documentJob.updateMany({
        where: { documentId, status: "PROCESSING", lockedBy: workerId },
        data: { lockedAt: new Date() },
      });
      if (lease.count !== 1) throw new DocumentJobLeaseLostError();

      const storedAnalysis = await transaction.documentAnalysis.create({
        data: {
          documentId,
          version: 1,
          status: safety.needsReview ? "NEEDS_REVIEW" : "READY",
          provider: analysis.provider,
          model: analysis.model,
          schemaVersion: "document-analysis-v1",
          promptVersion: "document-policy-v1",
          summary: analysis.result.summary,
          simpleExplanation: analysis.result.simpleExplanation,
          detectedLanguage: analysis.result.detectedLanguage,
          importance: analysis.result.importance,
          confidence: analysis.result.confidence,
          warnings: jsonValue(safety.warnings),
          normalizedPayload: jsonValue(analysis.result),
          inputTokens: analysis.inputTokens,
          outputTokens: analysis.outputTokens,
          completedAt: new Date(),
          entities: {
            create: analysis.result.entities.map((entity) => ({
              type: entity.type,
              label: entity.label,
              value: entity.value,
              normalizedValue: entity.normalizedValue,
              confidence: entity.confidence,
              pageNumber: entity.pageNumber,
              sourceText: entity.sourceText,
            })),
          },
        },
      });

      if (safety.actions.length > 0) {
        await transaction.actionItem.createMany({
          data: safety.actions.map((action, index) => ({
            workspaceId: document.workspaceId,
            sourceDocumentId: document.id,
            sourceAnalysisId: storedAnalysis.id,
            title: action.title,
            description: action.description,
            priority: action.priority,
            dueAt: atNoonUtc(action.dueDate),
            dueDateIsAllDay: true,
            sourceDateText: action.sourceDateText,
            confidence: action.confidence,
            generationReason: action.reason,
            generationKey: `analysis:${storedAnalysis.id}:action:${index}`,
            sourcePageNumber: action.pageNumber,
            sourceText: action.sourceText,
          })),
        });
      }

      await transaction.document.update({
        where: { id: document.id },
        data: {
          title: analysis.result.title,
          category: analysis.result.category,
          organizationName: analysis.result.organizationName,
          documentDate: atNoonUtc(analysis.result.documentDate),
          sourceDateText: analysis.result.sourceDateText,
          language: analysis.result.detectedLanguage,
          requiresAction: safety.actions.length > 0,
          status: safety.needsReview ? "NEEDS_REVIEW" : "READY",
          failureCode: null,
          failureMessage: null,
        },
      });

      await transaction.documentJob.update({
        where: { documentId },
        data: {
          status: "READY",
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: null,
          lastErrorAt: null,
        },
      });

      await transaction.auditEvent.create({
        data: {
          workspaceId: document.workspaceId,
          actorUserId: document.uploadedById,
          eventType: "document.analysis.completed",
          entityType: "document",
          entityId: document.id,
          metadata: {
            provider: analysis.provider,
            model: analysis.model,
            actionCount: safety.actions.length,
            withheldActionCount:
              analysis.result.actions.length - safety.actions.length,
            warningCount: safety.warnings.length,
          },
        },
      });
    });

    return { status: "ready" as const };
  } catch (error) {
    if (error instanceof DocumentJobLeaseLostError) {
      return { status: "not-claimed" as const };
    }

    const errorCode =
      error instanceof AnalysisConfigurationError ||
      error instanceof DocumentSourceIntegrityError
        ? error.code
        : "DOCUMENT_ANALYSIS_FAILED";
    const willRetry =
      !(error instanceof AnalysisConfigurationError) &&
      !(error instanceof DocumentSourceIntegrityError) &&
      claimedJob.attempts < MAX_PROCESSING_ATTEMPTS;

    try {
      await prisma.$transaction(async (transaction) => {
        const release = await transaction.documentJob.updateMany({
          where: { documentId, status: "PROCESSING", lockedBy: workerId },
          data: {
            status: willRetry ? "RETRY" : "FAILED",
            availableAt: willRetry ? retryAt(claimedJob.attempts) : new Date(),
            lockedAt: null,
            lockedBy: null,
            lastErrorCode: errorCode,
            lastErrorAt: new Date(),
          },
        });
        if (release.count !== 1) throw new DocumentJobLeaseLostError();

        await transaction.document.update({
          where: { id: documentId },
          data: {
            status: willRetry ? "QUEUED" : "FAILED",
            failureCode: willRetry ? null : errorCode,
            failureMessage: willRetry
              ? null
              : errorCode === "AI_NOT_CONFIGURED"
                ? "Document analysis is not configured in this environment."
                : errorCode === "DOCUMENT_SOURCE_INTEGRITY_FAILED"
                  ? "The stored source no longer matches the verified upload. Analysis stopped safely."
                  : "Document analysis failed safely. The source was retained.",
          },
        });

        if (
          error instanceof DocumentSourceIntegrityError &&
          failureAuditContext
        ) {
          await transaction.auditEvent.create({
            data: {
              workspaceId: failureAuditContext.workspaceId,
              actorUserId: failureAuditContext.actorUserId,
              eventType: "document.source.integrity_failed",
              entityType: "document",
              entityId: documentId,
              metadata: { code: error.code },
            },
          });
        }
      });
    } catch (releaseError) {
      if (releaseError instanceof DocumentJobLeaseLostError) {
        return { status: "not-claimed" as const };
      }
      throw releaseError;
    }

    return willRetry
      ? { status: "retry" as const, errorCode }
      : { status: "failed" as const, errorCode };
  }
}

export async function processAvailableDocumentJobs(limit = 5) {
  const prisma = getPrisma();
  const now = new Date();
  const jobs = await prisma.documentJob.findMany({
    where: {
      OR: [
        {
          status: { in: ["QUEUED", "RETRY"] },
          availableAt: { lte: now },
          lockedAt: null,
        },
        {
          status: "PROCESSING",
          lockedAt: { lte: staleBefore(now) },
        },
      ],
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: Math.max(1, Math.min(limit, 10)),
    select: { documentId: true },
  });

  const results = [];
  for (const job of jobs) {
    results.push(await processDocument(job.documentId));
  }

  return {
    selected: jobs.length,
    ready: results.filter((result) => result.status === "ready").length,
    retry: results.filter((result) => result.status === "retry").length,
    failed: results.filter((result) => result.status === "failed").length,
  };
}
