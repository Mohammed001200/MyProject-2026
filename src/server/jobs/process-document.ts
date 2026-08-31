import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import {
  AnalysisConfigurationError,
  getDocumentAnalysisProvider,
} from "@/server/ai/provider";
import { getPrisma } from "@/server/db/prisma";
import { getDocumentStorage } from "@/server/storage";

function atNoonUtc(value: string | null) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function processDocument(documentId: string) {
  const prisma = getPrisma();
  const workerId = `next-after-${randomUUID()}`;
  const now = new Date();

  const claim = await prisma.documentJob.updateMany({
    where: {
      documentId,
      status: { in: ["QUEUED", "RETRY"] },
      availableAt: { lte: now },
      lockedAt: null,
    },
    data: {
      status: "PROCESSING",
      lockedAt: now,
      lockedBy: workerId,
      attempts: { increment: 1 },
    },
  });

  if (claim.count !== 1) return { status: "not-claimed" as const };

  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
      include: { file: true },
    });

    if (!document.file) throw new Error("Document file metadata is missing");

    const bytes = await getDocumentStorage().read(document.file.objectKey);
    const analysis = await getDocumentAnalysisProvider().analyze({
      bytes,
      mimeType: document.file.verifiedMimeType as
        "application/pdf" | "image/jpeg" | "image/png",
      extension: document.file.extension as "pdf" | "jpg" | "jpeg" | "png",
    });

    await prisma.$transaction(async (transaction) => {
      const storedAnalysis = await transaction.documentAnalysis.create({
        data: {
          documentId,
          version: 1,
          status:
            analysis.result.warnings.length > 0 ? "NEEDS_REVIEW" : "READY",
          provider: analysis.provider,
          model: analysis.model,
          schemaVersion: "document-analysis-v1",
          promptVersion: "document-policy-v1",
          summary: analysis.result.summary,
          simpleExplanation: analysis.result.simpleExplanation,
          detectedLanguage: analysis.result.detectedLanguage,
          importance: analysis.result.importance,
          confidence: analysis.result.confidence,
          warnings: jsonValue(analysis.result.warnings),
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

      if (analysis.result.actions.length > 0) {
        await transaction.actionItem.createMany({
          data: analysis.result.actions.map((action, index) => ({
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
          requiresAction: analysis.result.actions.length > 0,
          status:
            analysis.result.warnings.length > 0 ? "NEEDS_REVIEW" : "READY",
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
            actionCount: analysis.result.actions.length,
            warningCount: analysis.result.warnings.length,
          },
        },
      });
    });

    return { status: "ready" as const };
  } catch (error) {
    const errorCode =
      error instanceof AnalysisConfigurationError
        ? error.code
        : "DOCUMENT_ANALYSIS_FAILED";

    await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          failureCode: errorCode,
          failureMessage:
            errorCode === "AI_NOT_CONFIGURED"
              ? "Document analysis is not configured in this environment."
              : "Document analysis failed safely. The source was retained.",
        },
      }),
      prisma.documentJob.update({
        where: { documentId },
        data: {
          status: "FAILED",
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: errorCode,
          lastErrorAt: new Date(),
        },
      }),
    ]);

    return { status: "failed" as const, errorCode };
  }
}
