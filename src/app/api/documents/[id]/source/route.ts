import {
  PrivateResourceNotFoundError,
  UnauthenticatedError,
  principalFromViewer,
  requireDocumentAccess,
  requireViewer,
} from "@/server/auth/authorization";
import {
  assertDocumentSourceIntegrity,
  DocumentSourceIntegrityError,
} from "@/server/documents/source-integrity";
import { getDocumentStorage } from "@/server/storage";
import { assertDocumentStorageProvider } from "@/server/storage/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceRouteProps = { params: Promise<{ id: string }> };

function safeError(code: string, status: number) {
  return Response.json(
    { code },
    {
      status,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );
}

export async function GET(_request: Request, { params }: SourceRouteProps) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const document = await requireDocumentAccess(
      principalFromViewer(viewer),
      id,
    );
    if (!document.file) throw new PrivateResourceNotFoundError();

    const storage = getDocumentStorage();
    assertDocumentStorageProvider(storage, document.file.storageProvider);
    const bytes = await storage.read(document.file.objectKey);
    assertDocumentSourceIntegrity(bytes, document.file);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="civora-source.${document.file.extension}"`,
        "Content-Length": String(bytes.byteLength),
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Type": document.file.verifiedMimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return safeError(error.code, 401);
    }
    if (error instanceof PrivateResourceNotFoundError) {
      return safeError(error.code, 404);
    }
    if (error instanceof DocumentSourceIntegrityError) {
      return safeError(error.code, 409);
    }
    return safeError("SOURCE_READ_FAILED", 500);
  }
}
