import { redirect } from "next/navigation";
import { WorkspaceToday } from "@/features/today/workspace-today";
import { requireViewer } from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";
const rank = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as const;

export default async function RealTodayPage() {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await requireViewer();
  const rows = await getPrisma().actionItem.findMany({
    where: { workspaceId: viewer.workspaceId, status: "OPEN" },
    include: { sourceDocument: { select: { id: true, title: true } } },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    take: 100,
  });
  const actions = rows
    .sort((left, right) => rank[left.priority] - rank[right.priority])
    .map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      priority: action.priority,
      dueAt: action.dueAt?.toISOString() ?? null,
      sourceDateText: action.sourceDateText,
      sourceDocument: action.sourceDocument,
    }));
  const firstName = viewer.session.user.name.trim().split(/\s+/)[0] ?? "there";
  return <WorkspaceToday firstName={firstName} initialActions={actions} />;
}
