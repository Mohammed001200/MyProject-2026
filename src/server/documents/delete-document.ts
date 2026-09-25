import "server-only";

import {
  PrivateResourceNotFoundError,
  type AuthorizationPrincipal,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";
import { getDocumentStorage } from "@/server/storage";
import { assertDocumentStorageProvider } from "@/server/storage/types";

type DeletionTarget = {
  id: string;
  workspaceId: string;
  file: { objectKey: string; storageProvider: string } | null;
};

const DELETION_RETRY_DELAY_MS = 5 * 60 * 1000;

async function postponeDeletionRetry(documentId: string) {
  await getPrisma().document.updateMany({
    where: { id: documentId, deletedAt: { not: null } },
    data: {
      deletedAt: new Date(Date.now() + DELETION_RETRY_DELAY_MS),
      failureCode: "DOCUMENT_DELETION_RETRY",
    },
  });
}

async function finalizeDocumentDeletion(
  document: DeletionTarget,
  actorUserId: string | null,
) {
  if (document.file) {
    const storage = getDocumentStorage();
    assertDocumentStorageProvider(storage, document.file.storageProvider);
    await storage.delete(document.file.objectKey);
  }

  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    await transaction.actionItem.deleteMany({
      where: {
        OR: [
          { sourceDocumentId: document.id },
          { sourceAnalysis: { is: { documentId: document.id } } },
        ],
      },
    });
    await transaction.documentAnalysis.deleteMany({
      where: { documentId: document.id },
    });
    const deleted = await transaction.document.deleteMany({
      where: { id: document.id, workspaceId: document.workspaceId },
    });
    if (deleted.count === 1) {
      await transaction.auditEvent.create({
        data: {
          workspaceId: document.workspaceId,
          actorUserId,
          eventType: "document.deleted",
          entityType: "document",
          entityId: document.id,
        },
      });
    }
  });
}

export async function deleteDocument(
  principal: AuthorizationPrincipal,
  documentId: string,
) {
  const prisma = getPrisma();
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: {
        is: { members: { some: { userId: principal.userId } } },
      },
    },
    select: {
      id: true,
      workspaceId: true,
      deletedAt: true,
      file: { select: { objectKey: true, storageProvider: true } },
    },
  });

  if (!document) throw new PrivateResourceNotFoundError();

  const deletionStartedAt = document.deletedAt ?? new Date();
  if (!document.deletedAt) {
    await prisma.$transaction(async (transaction) => {
      await transaction.documentJob.updateMany({
        where: { documentId: document.id },
        data: {
          status: "FAILED",
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: "DOCUMENT_DELETED",
          lastErrorAt: deletionStartedAt,
        },
      });
      await transaction.actionItem.deleteMany({
        where: {
          OR: [
            { sourceDocumentId: document.id },
            { sourceAnalysis: { is: { documentId: document.id } } },
          ],
        },
      });
      await transaction.documentAnalysis.deleteMany({
        where: { documentId: document.id },
      });
      await transaction.documentFile.updateMany({
        where: { documentId: document.id },
        data: {
          verifiedMimeType: "application/octet-stream",
          extension: "bin",
          sizeBytes: 1,
          sha256: "0".repeat(64),
        },
      });
      await transaction.document.update({
        where: { id: document.id },
        data: {
          deletedAt: deletionStartedAt,
          title: "Deletion pending",
          originalFileName: "deleted",
          category: "OTHER",
          organizationName: null,
          documentDate: null,
          sourceDateText: null,
          language: null,
          requiresAction: false,
          failureCode: "DOCUMENT_DELETION_PENDING",
          failureMessage: null,
        },
      });
      await transaction.auditEvent.create({
        data: {
          workspaceId: document.workspaceId,
          actorUserId: principal.userId,
          eventType: "document.deletion.requested",
          entityType: "document",
          entityId: document.id,
        },
      });
    });
  }

  try {
    await finalizeDocumentDeletion(document, principal.userId);
    return { deleted: true as const, pending: false as const };
  } catch {
    try {
      await postponeDeletionRetry(document.id);
    } catch {
      // The durable tombstone still remains eligible for a later retry.
    }
    return { deleted: false as const, pending: true as const };
  }
}

export async function cleanupPendingDocumentDeletions(limit = 5) {
  const prisma = getPrisma();
  const documents = await prisma.document.findMany({
    where: { deletedAt: { lte: new Date() } },
    orderBy: { deletedAt: "asc" },
    take: Math.max(1, Math.min(limit, 10)),
    select: {
      id: true,
      workspaceId: true,
      file: { select: { objectKey: true, storageProvider: true } },
    },
  });

  let deleted = 0;
  let failed = 0;
  for (const document of documents) {
    try {
      await finalizeDocumentDeletion(document, null);
      deleted += 1;
    } catch {
      failed += 1;
      try {
        await postponeDeletionRetry(document.id);
      } catch {
        // The tombstone remains private and eligible for a later retry.
      }
    }
  }

  return { selected: documents.length, deleted, failed };
}
