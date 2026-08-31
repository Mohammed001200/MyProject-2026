import "server-only";

import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";

export class UnauthenticatedError extends Error {
  readonly code = "UNAUTHENTICATED";

  constructor() {
    super("Authentication is required.");
    this.name = "UnauthenticatedError";
  }
}

export class PrivateResourceNotFoundError extends Error {
  readonly code = "PRIVATE_RESOURCE_NOT_FOUND";

  constructor() {
    super("The requested resource was not found.");
    this.name = "PrivateResourceNotFoundError";
  }
}

export type ViewerContext = NonNullable<
  Awaited<ReturnType<typeof getViewerContext>>
>;

export type AuthorizationPrincipal = {
  userId: string;
};

export function principalFromViewer(
  viewer: ViewerContext,
): AuthorizationPrincipal {
  return { userId: viewer.session.user.id };
}

export async function requireViewer(): Promise<ViewerContext> {
  const viewer = await getViewerContext();
  if (!viewer) throw new UnauthenticatedError();
  return viewer;
}

export async function requireWorkspaceAccess(
  principal: AuthorizationPrincipal,
  workspaceId: string,
) {
  const membership = await getPrisma().workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: principal.userId,
      },
    },
    select: {
      role: true,
      workspace: { select: { id: true, name: true, kind: true } },
    },
  });

  if (!membership) throw new PrivateResourceNotFoundError();
  return membership;
}

export async function requireDocumentAccess(
  principal: AuthorizationPrincipal,
  documentId: string,
) {
  const document = await getPrisma().document.findFirst({
    where: {
      id: documentId,
      deletedAt: null,
      workspace: {
        is: {
          members: { some: { userId: principal.userId } },
        },
      },
    },
    include: {
      file: true,
      analyses: {
        orderBy: { version: "desc" },
        take: 1,
        include: { entities: true },
      },
      actions: { orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!document) throw new PrivateResourceNotFoundError();
  return document;
}

export async function requireActionAccess(
  principal: AuthorizationPrincipal,
  actionId: string,
) {
  const action = await getPrisma().actionItem.findFirst({
    where: {
      id: actionId,
      workspace: {
        is: {
          members: { some: { userId: principal.userId } },
        },
      },
    },
  });

  if (!action) throw new PrivateResourceNotFoundError();
  return action;
}
