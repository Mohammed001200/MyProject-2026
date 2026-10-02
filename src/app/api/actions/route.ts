import { randomUUID } from "node:crypto";
import {
  actionDetailsData,
  actionDetailsSchema,
} from "@/features/actions/schema";
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const input = actionDetailsSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success)
      return Response.json({ code: "INVALID_ACTION_DETAILS" }, { status: 400 });
    const id = randomUUID();
    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.actionItem.create({
        data: {
          id,
          workspaceId: viewer.workspaceId,
          createdById: viewer.session.user.id,
          ...actionDetailsData(input.data),
        },
      }),
      prisma.auditEvent.create({
        data: {
          workspaceId: viewer.workspaceId,
          actorUserId: viewer.session.user.id,
          eventType: "action.created",
          entityType: "action",
          entityId: id,
        },
      }),
    ]);
    return Response.json(
      { id },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError)
      return Response.json({ code: error.code }, { status: 401 });
    return Response.json({ code: "ACTION_CREATE_FAILED" }, { status: 500 });
  }
}
