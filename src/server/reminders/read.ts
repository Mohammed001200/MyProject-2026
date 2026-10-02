import "server-only";
import { getPrisma } from "@/server/db/prisma";
import {
  requireWorkspaceAccess,
  type AuthorizationPrincipal,
} from "@/server/auth/authorization";
import { reminderDeadline } from "@/features/reminders/deadlines";
import { resolveLocale } from "@/features/localization/messages";

export async function readReminders(
  principal: AuthorizationPrincipal,
  workspaceId: string,
  now = new Date(),
) {
  await requireWorkspaceAccess(principal, workspaceId);
  const prisma = getPrisma();
  const [profile, candidates, reviews] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: principal.userId },
      select: { preferredLocale: true, timezone: true },
    }),
    prisma.actionItem.findMany({
      where: {
        workspaceId,
        status: "OPEN",
        dueAt: { lte: new Date(now.getTime() + 9 * 86_400_000) },
        AND: [
          {
            OR: [
              { sourceAnalysisId: null },
              { sourceAnalysis: { is: { status: "READY" } } },
            ],
          },
          {
            OR: [
              { sourceDocumentId: null },
              { sourceDocument: { is: { deletedAt: null } } },
            ],
          },
        ],
      },
      orderBy: [{ dueAt: "asc" }, { id: "asc" }],
      take: 101,
      select: { id: true, title: true, dueAt: true, dueDateIsAllDay: true },
    }),
    prisma.document.findMany({
      where: { workspaceId, deletedAt: null, status: "NEEDS_REVIEW" },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 21,
      select: { id: true, title: true },
    }),
  ]);
  const actions = candidates.slice(0, 100).flatMap((action) => {
    const deadline = reminderDeadline(
      action.dueAt,
      action.dueDateIsAllDay,
      profile?.timezone ?? "UTC",
      now,
    );
    return deadline
      ? [{ id: action.id, title: action.title, ...deadline }]
      : [];
  });
  return {
    locale: resolveLocale(profile?.preferredLocale),
    timezone: profile?.timezone ?? "UTC",
    actions,
    reviews: reviews.slice(0, 20),
    truncated: candidates.length > 100 || reviews.length > 20,
  };
}
