import { z } from "zod";
import {
  PrivateResourceNotFoundError,
  UnauthenticatedError,
  principalFromViewer,
  requireActionAccess,
  requireViewer,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";

const updateSchema = z.object({ status: z.enum(["OPEN", "COMPLETED"]) });
type ActionRouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: ActionRouteProps) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const input = updateSchema.safeParse(await request.json());
    if (!input.success)
      return Response.json({ code: "INVALID_ACTION_UPDATE" }, { status: 400 });
    const action = await requireActionAccess(principalFromViewer(viewer), id);
    const completed = input.data.status === "COMPLETED";
    await getPrisma().$transaction([
      getPrisma().actionItem.update({
        where: { id: action.id },
        data: {
          status: input.data.status,
          completedAt: completed ? new Date() : null,
          dismissedAt: null,
        },
      }),
      getPrisma().auditEvent.create({
        data: {
          workspaceId: action.workspaceId,
          actorUserId: viewer.session.user.id,
          eventType: completed ? "action.completed" : "action.reopened",
          entityType: "action",
          entityId: action.id,
        },
      }),
    ]);
    return Response.json({ id: action.id, status: input.data.status });
  } catch (error) {
    if (error instanceof UnauthenticatedError)
      return Response.json({ code: error.code }, { status: 401 });
    if (error instanceof PrivateResourceNotFoundError)
      return Response.json({ code: error.code }, { status: 404 });
    return Response.json({ code: "ACTION_UPDATE_FAILED" }, { status: 500 });
  }
}
