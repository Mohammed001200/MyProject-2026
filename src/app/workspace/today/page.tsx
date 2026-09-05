import { redirect } from "next/navigation";
import { WorkspaceToday } from "@/features/today/workspace-today";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";
const rank = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as const;

export default async function RealTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");
  const requestedStatus = (await searchParams).status;
  const status =
    requestedStatus === "COMPLETED" || requestedStatus === "DISMISSED"
      ? requestedStatus
      : "OPEN";
  const rows = await getPrisma().actionItem.findMany({
    where: {
      workspaceId: viewer.workspaceId,
      status,
      OR: [
        { sourceAnalysisId: null },
        { sourceAnalysis: { is: { status: "READY" } } },
      ],
    },
    include: { sourceDocument: { select: { id: true, title: true } } },
    orderBy:
      status === "OPEN"
        ? [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "asc" }]
        : [{ updatedAt: "desc" }],
    take: 100,
  });
  const actions = rows
    .sort((left, right) =>
      status === "OPEN" ? rank[left.priority] - rank[right.priority] : 0,
    )
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
  return (
    <WorkspaceToday
      key={status}
      firstName={firstName}
      initialActions={actions}
      status={status}
    />
  );
}
