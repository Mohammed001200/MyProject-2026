import {
  requireViewer,
  UnauthenticatedError,
  PrivateResourceNotFoundError,
} from "@/server/auth/authorization";
import { exportWorkspace, ExportTooLargeError } from "@/server/privacy/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function GET() {
  try {
    const viewer = await requireViewer();
    return new Response(await exportWorkspace(viewer), {
      headers: {
        ...headers,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="civora-workspace-export.json"',
      },
    });
  } catch (error) {
    const status =
      error instanceof UnauthenticatedError
        ? 401
        : error instanceof PrivateResourceNotFoundError
          ? 404
          : error instanceof ExportTooLargeError
            ? 413
            : 500;
    return Response.json(
      {
        code:
          status === 401
            ? "UNAUTHENTICATED"
            : status === 404
              ? "NOT_FOUND"
              : status === 413
                ? "EXPORT_TOO_LARGE"
                : "EXPORT_FAILED",
      },
      { status, headers },
    );
  }
}
