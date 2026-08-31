import { randomUUID } from "node:crypto";
import { after } from "next/server";
import {
  InvalidDocumentFileError,
  validateUploadedDocument,
} from "@/features/documents/server-file-policy";
import {
  UnauthenticatedError,
  requireViewer,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";
import { isConfigurationError } from "@/server/env";
import { processDocument } from "@/server/jobs/process-document";
import { createDocumentObjectKey, getDocumentStorage } from "@/server/storage";
import {
  InvalidUploadFormError,
  UploadRequestTooLargeError,
  readDocumentUploadForm,
} from "@/server/uploads/request-body";
import {
  UploadRateLimitError,
  consumeUploadAttempt,
} from "@/server/uploads/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const prisma = getPrisma();
    await consumeUploadAttempt({
      userId: viewer.session.user.id,
      workspaceId: viewer.workspaceId,
    });
    const form = await readDocumentUploadForm(request);
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json(
        { code: "FILE_REQUIRED", message: "Choose one document to upload." },
        { status: 400 },
      );
    }

    const validated = await validateUploadedDocument(file);
    const documentId = randomUUID();
    const objectKey = createDocumentObjectKey(
      viewer.workspaceId,
      documentId,
      validated.extension,
    );
    const storage = getDocumentStorage();
    await storage.put(objectKey, validated.bytes);

    try {
      await prisma.$transaction(async (transaction) => {
        await transaction.document.create({
          data: {
            id: documentId,
            workspaceId: viewer.workspaceId,
            uploadedById: viewer.session.user.id,
            title: validated.originalFileName.replace(/\.[^.]+$/, ""),
            originalFileName: validated.originalFileName,
            status: "QUEUED",
            file: {
              create: {
                storageProvider: "local-private",
                objectKey,
                verifiedMimeType: validated.mimeType,
                extension: validated.extension,
                sizeBytes: validated.sizeBytes,
                sha256: validated.sha256,
              },
            },
            job: { create: { status: "QUEUED" } },
          },
        });

        await transaction.auditEvent.create({
          data: {
            workspaceId: viewer.workspaceId,
            actorUserId: viewer.session.user.id,
            eventType: "document.uploaded",
            entityType: "document",
            entityId: documentId,
            metadata: {
              mimeType: validated.mimeType,
              sizeBytes: validated.sizeBytes,
            },
          },
        });
      });
    } catch (error) {
      await storage.delete(objectKey);
      throw error;
    }

    after(async () => {
      await processDocument(documentId);
    });

    return Response.json({ documentId, status: "QUEUED" }, { status: 202 });
  } catch (error) {
    if (error instanceof InvalidDocumentFileError) {
      return Response.json(
        { code: error.code, message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof UploadRequestTooLargeError) {
      return Response.json(
        { code: error.code, message: "The upload limit is 10 MB." },
        { status: 413 },
      );
    }
    if (error instanceof InvalidUploadFormError) {
      return Response.json(
        { code: error.code, message: "The upload request is invalid." },
        { status: 400 },
      );
    }
    if (error instanceof UploadRateLimitError) {
      return Response.json(
        { code: error.code, message: error.message },
        { status: 429 },
      );
    }
    if (error instanceof UnauthenticatedError) {
      return Response.json(
        { code: error.code, message: "Authentication is required." },
        { status: 401 },
      );
    }
    if (isConfigurationError(error)) {
      return Response.json(
        { code: "SERVICE_NOT_CONFIGURED", message: "Upload is not available." },
        { status: 503 },
      );
    }

    console.error("[documents] Upload failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { code: "UPLOAD_FAILED", message: "The document was not uploaded." },
      { status: 500 },
    );
  }
}
