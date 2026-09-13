import { notFound, redirect } from "next/navigation";
import { DocumentChat } from "@/features/chat/document-chat";
import { getViewerContext } from "@/server/auth/session";
import { PrivateResourceNotFoundError } from "@/server/auth/authorization";
import { readChat } from "@/server/chat/service";
import { inspectAuthEnvironment } from "@/server/env";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ask CIVORA",
  robots: { index: false, follow: false },
};
export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");
  const { id } = await params;
  const chat = await readChat(viewer, id).catch((error: unknown) => {
    if (error instanceof PrivateResourceNotFoundError) notFound();
    throw error;
  });
  return (
    <DocumentChat
      documentId={id}
      title={chat.title}
      initialTurns={chat.turns}
    />
  );
}
