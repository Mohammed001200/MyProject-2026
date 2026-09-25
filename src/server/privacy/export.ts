import "server-only";
import { Prisma } from "@/generated/prisma/client";
import {
  PrivateResourceNotFoundError,
  type ViewerContext,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";

const MAX_ROWS = 500;
const MAX_BYTES = 3_000_000;
export class ExportTooLargeError extends Error {}

// An allowlist prevents authentication credentials and storage locators from
// becoming part of an export when new columns are added to database models.
export async function exportWorkspace(viewer: ViewerContext) {
  const userId = viewer.session.user.id;
  return getPrisma().$transaction(
    async (tx) => {
      const membership = await tx.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId: viewer.workspaceId,
          role: "OWNER",
          workspace: { kind: "PERSONAL" },
        },
        select: {
          workspace: { select: { id: true, name: true, createdAt: true } },
        },
      });
      if (!membership) throw new PrivateResourceNotFoundError();
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          profile: {
            select: {
              preferredLocale: true,
              timezone: true,
              explanationStyle: true,
              onboardingDone: true,
            },
          },
        },
      });
      const documents = await tx.document.findMany({
        where: { workspaceId: viewer.workspaceId, deletedAt: null },
        orderBy: { id: "asc" },
        take: MAX_ROWS + 1,
        select: {
          id: true,
          title: true,
          originalFileName: true,
          status: true,
          category: true,
          organizationName: true,
          documentDate: true,
          language: true,
          createdAt: true,
          analyses: {
            orderBy: { version: "desc" },
            take: 1,
            select: {
              version: true,
              status: true,
              summary: true,
              simpleExplanation: true,
              warnings: true,
              completedAt: true,
              entities: {
                select: {
                  type: true,
                  label: true,
                  value: true,
                  normalizedValue: true,
                  pageNumber: true,
                  sourceText: true,
                },
              },
            },
          },
        },
      });
      const actions = await tx.actionItem.findMany({
        where: {
          workspaceId: viewer.workspaceId,
          OR: [
            { sourceDocumentId: null },
            { sourceDocument: { deletedAt: null } },
          ],
        },
        orderBy: { id: "asc" },
        take: MAX_ROWS + 1,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueAt: true,
          dueDateIsAllDay: true,
          sourceDocumentId: true,
          sourcePageNumber: true,
          sourceText: true,
          createdAt: true,
          completedAt: true,
          dismissedAt: true,
        },
      });
      const conversations = await tx.chatTurn.findMany({
        where: {
          userId,
          document: { workspaceId: viewer.workspaceId, deletedAt: null },
        },
        orderBy: { id: "asc" },
        take: MAX_ROWS + 1,
        select: {
          id: true,
          documentId: true,
          question: true,
          answer: true,
          citations: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
      });
      if (
        [documents, actions, conversations].some(
          (rows) => rows.length > MAX_ROWS,
        )
      )
        throw new ExportTooLargeError();
      const body = JSON.stringify(
        {
          format: "civora-workspace-export-v1",
          exportedAt: new Date().toISOString(),
          scope:
            "Personal workspace, latest document analyses, actions and your private conversations. Original files, older analysis versions, operational audit records and other workspaces are not included.",
          user,
          workspace: membership.workspace,
          documents,
          actions,
          conversations,
        },
        null,
        2,
      );
      if (Buffer.byteLength(body, "utf8") > MAX_BYTES)
        throw new ExportTooLargeError();
      await tx.auditEvent.create({
        data: {
          workspaceId: viewer.workspaceId,
          actorUserId: userId,
          eventType: "workspace.exported",
          entityType: "workspace",
          entityId: viewer.workspaceId,
        },
      });
      return body;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      timeout: 15_000,
    },
  );
}
