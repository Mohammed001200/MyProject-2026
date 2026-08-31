import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHome } from "@/features/workspace/workspace-home";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your workspace",
  robots: { index: false, follow: false },
};

export default async function WorkspacePage() {
  if (inspectAuthEnvironment().state !== "ready") {
    redirect("/auth/sign-in");
  }

  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");

  const [profile, workspace] = await Promise.all([
    getPrisma().profile.findUnique({
      where: { userId: viewer.session.user.id },
      select: { onboardingDone: true },
    }),
    getPrisma().workspace.findUnique({
      where: { id: viewer.workspaceId },
      select: { name: true },
    }),
  ]);

  if (!profile?.onboardingDone) redirect("/onboarding");
  if (!workspace) throw new Error("Workspace context could not be resolved");

  const firstName = viewer.session.user.name.trim().split(/\s+/)[0] ?? "there";

  return <WorkspaceHome firstName={firstName} workspaceName={workspace.name} />;
}
