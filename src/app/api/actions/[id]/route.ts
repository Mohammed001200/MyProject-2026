import {
  actionDetailsData,
  actionUpdateSchema,
} from "@/features/actions/schema";
import {
  PrivateResourceNotFoundError,
  UnauthenticatedError,
  principalFromViewer,
  requireActionAccess,
  requireViewer,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";

const eventTypes = {
  OPEN: "action.reopened",
  COMPLETED: "action.completed",
  DISMISSED: "action.dismissed",
} as const;
type ActionRouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: ActionRouteProps) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const input = actionUpdateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success)
      return Response.json({ code: "INVALID_ACTION_UPDATE" }, { status: 400 });
    const action = await requireActionAccess(principalFromViewer(viewer), id);
    const now = new Date();
    const data =
      "status" in input.data
        ? {
            status: input.data.status,
            completedAt: input.data.status === "COMPLETED" ? now : null,
            dismissedAt: input.data.status === "DISMISSED" ? now : null,
          }
        : actionDetailsData(input.data);
    const eventType =
      "status" in input.data ? eventTypes[input.data.status] : "action.edited";
    await getPrisma().$transaction([
      getPrisma().actionItem.update({
        where: { id: action.id },
        data,
      }),
      getPrisma().auditEvent.create({
        data: {
          workspaceId: action.workspaceId,
          actorUserId: viewer.session.user.id,
          eventType,
          entityType: "action",
          entityId: action.id,
        },
      }),
    ]);
    return Response.json({
      id: action.id,
      ...("status" in input.data ? { status: input.data.status } : {}),
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError)
      return Response.json({ code: error.code }, { status: 401 });
    if (error instanceof PrivateResourceNotFoundError)
      return Response.json({ code: error.code }, { status: 404 });
    return Response.json({ code: "ACTION_UPDATE_FAILED" }, { status: 500 });
  }
}
