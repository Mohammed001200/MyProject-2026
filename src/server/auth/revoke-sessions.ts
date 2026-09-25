import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { UnauthenticatedError, type ViewerContext } from "./authorization";

export async function revokeOtherSessions(viewer: ViewerContext) {
  const userId = viewer.session.user.id;
  const sessionId = viewer.session.session.id;
  return getPrisma().$transaction(async (tx) => {
    const current = await tx.session.findFirst({
      where: { id: sessionId, userId, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!current) throw new UnauthenticatedError();
    const result = await tx.session.deleteMany({
      where: { userId, id: { not: current.id } },
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: userId,
        eventType: "account.other_sessions.revoked",
        entityType: "user",
        entityId: userId,
        metadata: { revokedCount: result.count },
      },
    });
    return result.count;
  });
}
