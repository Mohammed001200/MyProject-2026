import { getUserLocale } from "@/server/preferences/locale";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceUploadForm } from "@/features/documents/workspace-upload-form";
import { getViewerContext } from "@/server/auth/session";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Upload document",
  robots: { index: false, follow: false },
};

export default async function WorkspaceUploadPage() {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");
  const locale = await getUserLocale(viewer.session.user.id);
  return <WorkspaceUploadForm locale={locale} />;
}
