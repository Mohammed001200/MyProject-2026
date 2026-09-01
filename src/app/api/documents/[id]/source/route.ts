import {
  PrivateResourceNotFoundError,
  UnauthenticatedError,
  principalFromViewer,
  requireDocumentAccess,
  requireViewer,
} from "@/server/auth/authorization";
import { getDocumentStorage } from "@/server/storage";
import { assertDocumentStorageProvider } from "@/server/storage/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceRouteProps = { params: Promise<{ id: string }> };

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
      return Response.json({ code: error.code }, { status: 401 });
    }
    if (error instanceof PrivateResourceNotFoundError) {
      return Response.json({ code: error.code }, { status: 404 });
    }
    return Response.json({ code: "SOURCE_READ_FAILED" }, { status: 500 });
  }
}
