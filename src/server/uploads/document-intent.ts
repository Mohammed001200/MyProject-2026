import "server-only";

import { deleteDocument } from "@/server/documents/delete-document";
import { getPrisma } from "@/server/db/prisma";
import type {
  DocumentStorage,
  DocumentStorageProvider,
} from "@/server/storage/types";

const INTENT_FAILURE_CODE = "DOCUMENT_UPLOAD_INTENT_PENDING";
const CLEANUP_FAILURE_CODE = "DOCUMENT_UPLOAD_CLEANUP_PENDING";

export const DOCUMENT_UPLOAD_INTENT_TTL_MS = 60 * 60 * 1000;

export type DocumentUploadIntent = {
  documentId: string;
  workspaceId: string;
  userId: string;
  storageProvider: DocumentStorageProvider;
  objectKey: string;
  cleanupAt: Date;
};

export type PromotedDocumentMetadata = {
  title: string;
  originalFileName: string;
  verifiedMimeType: string;
  extension: string;
  sizeBytes: number;
  sha256: string;
};

export class DocumentUploadIntentStateError extends Error {
  constructor() {
    super("The document upload intent can no longer be promoted.");
    this.name = "DocumentUploadIntentStateError";
  }
}

export async function createDocumentUploadIntent(input: {
  documentId: string;
  workspaceId: string;
  userId: string;
  storageProvider: DocumentStorageProvider;
  objectKey: string;
  cleanupAt?: Date;
}): Promise<DocumentUploadIntent> {
  const cleanupAt =
    input.cleanupAt ?? new Date(Date.now() + DOCUMENT_UPLOAD_INTENT_TTL_MS);

  await getPrisma().document.create({
    data: {
      id: input.documentId,
      workspaceId: input.workspaceId,
      uploadedById: input.userId,
      title: "Upload pending",
      originalFileName: "pending",
      status: "UPLOADED",
      failureCode: INTENT_FAILURE_CODE,
      deletedAt: cleanupAt,
      file: {
        create: {
          storageProvider: input.storageProvider,
          objectKey: input.objectKey,
          verifiedMimeType: "application/octet-stream",
          extension: "bin",
          sizeBytes: 1,
          sha256: "0".repeat(64),
        },
      },
    },
  });

  return { ...input, cleanupAt };
}

export async function promoteDocumentUploadIntent(
  intent: DocumentUploadIntent,
  metadata: PromotedDocumentMetadata,
) {
  const prisma = getPrisma();

  await prisma.$transaction(async (transaction) => {
    const file = await transaction.documentFile.updateMany({
      where: {
        documentId: intent.documentId,
        storageProvider: intent.storageProvider,
        objectKey: intent.objectKey,
      },
      data: {
        verifiedMimeType: metadata.verifiedMimeType,
        extension: metadata.extension,
        sizeBytes: metadata.sizeBytes,
        sha256: metadata.sha256,
      },
    });
    if (file.count !== 1) throw new DocumentUploadIntentStateError();

    const document = await transaction.document.updateMany({
      where: {
        id: intent.documentId,
        workspaceId: intent.workspaceId,
        uploadedById: intent.userId,
        status: "UPLOADED",
        failureCode: INTENT_FAILURE_CODE,
        deletedAt: intent.cleanupAt,
      },
      data: {
        title: metadata.title,
        originalFileName: metadata.originalFileName,
        status: "QUEUED",
        failureCode: null,
        failureMessage: null,
        deletedAt: null,
      },
    });
    if (document.count !== 1) throw new DocumentUploadIntentStateError();

    await transaction.documentJob.create({
      data: { documentId: intent.documentId, status: "QUEUED" },
    });
    await transaction.auditEvent.create({
      data: {
        workspaceId: intent.workspaceId,
        actorUserId: intent.userId,
        eventType: "document.uploaded",
        entityType: "document",
        entityId: intent.documentId,
        metadata: {
          mimeType: metadata.verifiedMimeType,
          sizeBytes: metadata.sizeBytes,
        },
      },
    });
  });
}

export async function abandonDocumentUploadIntent(
  intent: DocumentUploadIntent,
  storage: DocumentStorage,
) {
  const cleanupRequestedAt = new Date();

  try {
    await getPrisma().$transaction(async (transaction) => {
      const marked = await transaction.document.updateMany({
        where: {
          id: intent.documentId,
          workspaceId: intent.workspaceId,
          uploadedById: intent.userId,
          status: "UPLOADED",
          failureCode: INTENT_FAILURE_CODE,
          deletedAt: intent.cleanupAt,
        },
        data: {
          deletedAt: cleanupRequestedAt,
          failureCode: CLEANUP_FAILURE_CODE,
          failureMessage: null,
        },
      });

      if (marked.count === 1) {
        await transaction.auditEvent.create({
          data: {
            workspaceId: intent.workspaceId,
            actorUserId: intent.userId,
            eventType: "document.upload.cleanup.requested",
            entityType: "document",
            entityId: intent.documentId,
          },
        });
      }
    });
  } catch {
    // The original future tombstone remains durable if the database is down.
  }

  try {
    const result = await deleteDocument(
      { userId: intent.userId },
      intent.documentId,
    );
    if (result.deleted) return;
  } catch {
    // The cleanup runner can retry the durable tombstone after recovery.
  }

  try {
    await storage.delete(intent.objectKey);
  } catch {
    // A due tombstone retains the provider and key for a coordinated retry.
  }
}
