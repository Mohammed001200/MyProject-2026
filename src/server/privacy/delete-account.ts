import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/prisma";
import {
  UnauthenticatedError,
  type ViewerContext,
} from "@/server/auth/authorization";

export class AccountDeletionBlockedError extends Error {
  constructor(
    public code: "DOCUMENTS_REMAIN" | "SHARED_WORKSPACE" | "TOO_MANY_ATTEMPTS",
  ) {
    super(code);
  }
}

export async function reserveDeletionAttempt(viewer: ViewerContext) {
  const userId = viewer.session.user.id;
  await getPrisma().$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`,
    );
    const attempts = await tx.auditEvent.count({
      where: {
        actorUserId: userId,
        eventType: "account.deletion.attempted",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (attempts >= 5)
      throw new AccountDeletionBlockedError("TOO_MANY_ATTEMPTS");
    await tx.auditEvent.create({
      data: {
        actorUserId: userId,
        eventType: "account.deletion.attempted",
        entityType: "user",
      },
    });
  });
}

// Called only after current-password verification. Never cascade a workspace
// with source files: the document cleanup runner owns object deletion.
export async function deleteEmptyAccount(viewer: ViewerContext) {
  const userId = viewer.session.user.id;
  await getPrisma().$transaction(
    async (tx) => {
      const session = await tx.session.findFirst({
        where: {
          id: viewer.session.session.id,
          userId,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      if (!session) throw new UnauthenticatedError();
      const memberships = await tx.workspaceMember.findMany({
        where: { userId },
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              kind: true,
              _count: { select: { members: true } },
            },
          },
        },
      });
      if (
        memberships.some(
          (m) =>
            m.role !== "OWNER" ||
            m.workspace.kind !== "PERSONAL" ||
            m.workspace._count.members !== 1,
        )
      )
        throw new AccountDeletionBlockedError("SHARED_WORKSPACE");
      const workspaceIds = memberships.map((m) => m.workspace.id);
      const documents = await tx.document.count({
        where: {
          OR: [{ uploadedById: userId }, { workspaceId: { in: workspaceIds } }],
        },
      });
      if (documents !== 0)
        throw new AccountDeletionBlockedError("DOCUMENTS_REMAIN");
      // Delete the user before the empty workspaces. The source uploader FK is
      // RESTRICT, so a concurrent upload prevents deletion rather than orphaning
      // its storage object. Serializable conflicts roll the entire operation back.
      await tx.verification.deleteMany({
        where: {
          OR: [{ value: userId }, { identifier: viewer.session.user.email }],
        },
      });
      await tx.auditEvent.deleteMany({
        where: {
          OR: [{ actorUserId: userId }, { workspaceId: { in: workspaceIds } }],
        },
      });
      await tx.user.delete({ where: { id: userId } });
      await tx.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
      await tx.auditEvent.create({
        data: { eventType: "account.deleted", entityType: "user" },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
