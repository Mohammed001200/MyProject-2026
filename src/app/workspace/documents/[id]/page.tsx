import { notFound, redirect } from "next/navigation";
import { RealDocumentDetail } from "@/features/documents/real-document-detail";
import {
  PrivateResourceNotFoundError,
  principalFromViewer,
  requireDocumentAccess,
  requireViewer,
} from "@/server/auth/authorization";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";

type WorkspaceDocumentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkspaceDocumentPage({
  params,
}: WorkspaceDocumentPageProps) {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await requireViewer();
  const { id } = await params;
  try {
    await requireDocumentAccess(principalFromViewer(viewer), id);
  } catch (error) {
    if (error instanceof PrivateResourceNotFoundError) notFound();
    throw error;
  }
  return <RealDocumentDetail documentId={id} />;
}
