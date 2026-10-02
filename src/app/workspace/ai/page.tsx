import { documentMessages } from "@/features/localization/document-messages";
import { getUserLocale } from "@/server/preferences/locale";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "CIVORA AI",
  robots: { index: false, follow: false },
};
export default async function ChatDocumentsPage() {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");
  const locale = await getUserLocale(viewer.session.user.id);
  const text = documentMessages[locale];
  const documents = await getPrisma().document.findMany({
    where: {
      workspaceId: viewer.workspaceId,
      deletedAt: null,
      status: "READY",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true },
  });
  return (
    <main lang={locale} className="min-h-dvh bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/workspace"
          className="inline-flex min-h-11 items-center text-sm font-bold text-brand"
        >
          {text.back}
        </Link>
        <h1 className="display-type mt-6 text-5xl text-ink">
          {text.askDocuments}
        </h1>
        <p className="mt-4 leading-7 text-ink-soft">{text.selectionHelp}</p>
        <div className="mt-8 divide-y divide-line">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/workspace/ai/${document.id}` as Route}
              className="block min-h-11 py-5 font-bold text-brand"
            >
              {document.title}
            </Link>
          ))}
        </div>
        {!documents.length && (
          <p className="mt-8 text-ink-soft">
            {text.noAnalyzed}{" "}
            <Link href="/workspace/upload" className="underline">
              {text.addOne}
            </Link>{" "}
            to get started.
          </p>
        )}
        {documents.length === 100 && (
          <p className="mt-4 text-xs text-ink-soft">{text.chatLimit}</p>
        )}
      </div>
    </main>
  );
}
