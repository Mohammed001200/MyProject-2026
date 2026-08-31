import "server-only";

import type { CivoraPrismaClient } from "@/server/db/prisma";

type UserIdentity = {
  id: string;
  name: string;
};

function personalWorkspaceSlug(userId: string) {
  return `personal-${userId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

function personalWorkspaceName(name: string) {
  const firstName = name.trim().split(/\s+/)[0];
  return firstName ? `${firstName}'s space` : "Personal space";
}

export async function ensurePersonalWorkspace(
  prisma: CivoraPrismaClient,
  user: UserIdentity,
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const existingMembership = await transaction.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspace: { is: { kind: "PERSONAL" } },
      },
      select: { workspaceId: true },
    });

    if (existingMembership) {
      return existingMembership.workspaceId;
    }

    const workspace = await transaction.workspace.upsert({
      where: { slug: personalWorkspaceSlug(user.id) },
      update: {},
      create: {
        name: personalWorkspaceName(user.name),
        slug: personalWorkspaceSlug(user.id),
        kind: "PERSONAL",
      },
      select: { id: true },
    });

    await transaction.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      update: { role: "OWNER" },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    await transaction.auditEvent.create({
      data: {
        workspaceId: workspace.id,
        actorUserId: user.id,
        eventType: "workspace.personal.created",
        entityType: "workspace",
        entityId: workspace.id,
        metadata: { source: "auth-bootstrap" },
      },
    });

    return workspace.id;
  });
}
