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
import {
  abandonDocumentUploadIntent,
  createDocumentUploadIntent,
  DOCUMENT_UPLOAD_INTENT_TTL_MS,
  promoteDocumentUploadIntent,
  type DocumentUploadIntent,
} from "@/server/uploads/document-intent";
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
    const intent = {
      documentId,
      workspaceId: viewer.workspaceId,
      userId: viewer.session.user.id,
      storageProvider: storage.provider,
      objectKey,
      cleanupAt: new Date(Date.now() + DOCUMENT_UPLOAD_INTENT_TTL_MS),
    } satisfies DocumentUploadIntent;
    try {
      await createDocumentUploadIntent(intent);
      await storage.put(objectKey, validated.bytes);
      await promoteDocumentUploadIntent(intent, {
        title: validated.originalFileName.replace(/\.[^.]+$/, ""),
        originalFileName: validated.originalFileName,
        verifiedMimeType: validated.mimeType,
        extension: validated.extension,
        sizeBytes: validated.sizeBytes,
        sha256: validated.sha256,
      });
    } catch (error) {
      await abandonDocumentUploadIntent(intent, storage);
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
