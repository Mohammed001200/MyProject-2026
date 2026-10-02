import {
  requireViewer,
  UnauthenticatedError,
  PrivateResourceNotFoundError,
} from "@/server/auth/authorization";
import { askDocument, readChat } from "@/server/chat/service";
import { ChatError } from "@/server/chat/provider";
import { chatInputSchema } from "@/server/chat/schema";
import { readRequestBodyWithLimit } from "@/server/uploads/request-body";
import { getPrisma } from "@/server/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  const status =
    error instanceof UnauthenticatedError
      ? 401
      : error instanceof PrivateResourceNotFoundError
        ? 404
        : error instanceof ChatError
          ? error.status
          : 500;
  return Response.json(
    {
      code:
        error instanceof ChatError
          ? error.code
          : status === 401
            ? "UNAUTHENTICATED"
            : status === 404
              ? "NOT_FOUND"
              : "CHAT_FAILED",
    },
    { status, headers },
  );
}
export async function GET(_request: Request, { params }: Context) {
  try {
    const viewer = await requireViewer();
    return Response.json(await readChat(viewer, (await params).id), {
      headers,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const viewer = await requireViewer();
    let value: unknown;
    try {
      value = JSON.parse(
        new TextDecoder().decode(
          await readRequestBodyWithLimit(request, 12_000),
        ),
      );
    } catch {
      return Response.json(
        { code: "INVALID_CHAT_REQUEST" },
        { status: 400, headers },
      );
    }
    const input = chatInputSchema.safeParse(value);
    if (!input.success)
      return Response.json(
        { code: "INVALID_CHAT_REQUEST" },
        { status: 400, headers },
      );
    const documentId = (await params).id;
    const turnId = await askDocument(viewer, documentId, input.data);
    return Response.json(
      { turnId, ...(await readChat(viewer, documentId)) },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const viewer = await requireViewer();
    const documentId = (await params).id;
    await readChat(viewer, documentId);
    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.chatTurn.deleteMany({
        where: { documentId, userId: viewer.session.user.id },
      }),
      prisma.auditEvent.create({
        data: {
          workspaceId: viewer.workspaceId,
          actorUserId: viewer.session.user.id,
          eventType: "chat.history.deleted",
          entityType: "document",
          entityId: documentId,
        },
      }),
    ]);
    return Response.json({ deleted: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
