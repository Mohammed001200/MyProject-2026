import {
  PrivateResourceNotFoundError,
  UnauthenticatedError,
  principalFromViewer,
  requireDocumentAccess,
  requireViewer,
} from "@/server/auth/authorization";
import { deleteDocument } from "@/server/documents/delete-document";

export const dynamic = "force-dynamic";

type DocumentRouteProps = { params: Promise<{ id: string }> };
const privateNoStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET(_request: Request, { params }: DocumentRouteProps) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const document = await requireDocumentAccess(
      principalFromViewer(viewer),
      id,
    );
    const analysis = document.analyses[0] ?? null;

    return Response.json(
      {
        id: document.id,
        title: document.title,
        status: document.status,
        category: document.category,
        organizationName: document.organizationName,
        documentDate: document.documentDate,
        requiresAction: document.requiresAction,
        failureCode: document.failureCode,
        failureMessage: document.failureMessage,
        createdAt: document.createdAt,
        file: document.file
          ? {
              mimeType: document.file.verifiedMimeType,
              sizeBytes: Number(document.file.sizeBytes),
              sourceUrl: `/api/documents/${document.id}/source`,
            }
          : null,
        analysis: analysis
          ? {
              status: analysis.status,
              summary: analysis.summary,
              simpleExplanation: analysis.simpleExplanation,
              importance: analysis.importance,
              confidence: analysis.confidence
                ? Number(analysis.confidence)
                : null,
              warnings: Array.isArray(analysis.warnings)
                ? analysis.warnings.filter(
                    (warning): warning is string => typeof warning === "string",
                  )
                : [],
              entities: analysis.entities.map((entity) => ({
                ...entity,
                confidence: entity.confidence
                  ? Number(entity.confidence)
                  : null,
              })),
            }
          : null,
        actions: document.actions.map((action) => ({
          ...action,
          confidence: action.confidence ? Number(action.confidence) : null,
        })),
      },
      { headers: privateNoStoreHeaders },
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return Response.json({ code: error.code }, { status: 401 });
    }
    if (error instanceof PrivateResourceNotFoundError) {
      return Response.json({ code: error.code }, { status: 404 });
    }
    return Response.json({ code: "DOCUMENT_READ_FAILED" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: DocumentRouteProps,
) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const result = await deleteDocument(principalFromViewer(viewer), id);
    return Response.json(
      { id, ...result },
      {
        status: result.pending ? 202 : 200,
        headers: privateNoStoreHeaders,
      },
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return Response.json({ code: error.code }, { status: 401 });
    }
    if (error instanceof PrivateResourceNotFoundError) {
      return Response.json({ code: error.code }, { status: 404 });
    }
    return Response.json({ code: "DOCUMENT_DELETE_FAILED" }, { status: 500 });
  }
}
