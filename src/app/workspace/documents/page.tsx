import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documents",
  robots: { index: false, follow: false },
};

type WorkspaceDocumentsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    deletion?: string | string[];
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const statusLabels: Record<string, string> = {
  UPLOADED: "Uploaded",
  QUEUED: "Queued",
  PROCESSING: "Analyzing",
  READY: "Ready",
  NEEDS_REVIEW: "Needs review",
  FAILED: "Stopped",
};

const documentsRoute = "/workspace/documents" as Route;

function categoryLabel(category: string) {
  return category.toLowerCase().replaceAll("_", " ");
}

export default async function WorkspaceDocumentsPage({
  searchParams,
}: WorkspaceDocumentsPageProps) {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");

  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");

  const parameters = await searchParams;
  const requestedQuery = parameters.q;
  const query = (
    Array.isArray(requestedQuery) ? requestedQuery[0] : requestedQuery
  )
    ?.trim()
    .slice(0, 80);
  const deletionState = Array.isArray(parameters.deletion)
    ? parameters.deletion[0]
    : parameters.deletion;

  const documents = await getPrisma().document.findMany({
    where: {
      workspaceId: viewer.workspaceId,
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              {
                organizationName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                originalFileName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      category: true,
      organizationName: true,
      documentDate: true,
      createdAt: true,
      requiresAction: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/workspace"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-soft no-underline"
          >
            <ArrowLeft className="h-4 w-4" /> Workspace
          </Link>
          <nav className="flex items-center gap-2" aria-label="Workspace">
            <Link
              href="/workspace/today"
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-ink-soft no-underline"
            >
              Today
            </Link>
            <Link
              href="/workspace/upload"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-strong px-4 text-sm font-bold text-white no-underline"
            >
              <Plus className="h-4 w-4" /> Add document
            </Link>
          </nav>
        </header>

        {deletionState === "pending" && (
          <p
            className="mt-6 rounded-2xl border border-attention/25 bg-attention-wash px-4 py-3 text-sm text-ink"
            role="status"
          >
            The document is hidden. Secure source deletion is queued and will
            retry automatically.
          </p>
        )}

        <section className="mt-14 sm:mt-16">
          <p className="eyebrow text-brand">Your documents</p>
          <h1 className="display-type mt-4 text-5xl font-medium tracking-[-0.04em] text-ink sm:text-6xl">
            Every source, in one place.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
            Find an uploaded document and follow its analysis, actions, and
            original source.
          </p>

          <form
            action="/workspace/documents"
            method="get"
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            role="search"
          >
            <label className="relative flex-1" htmlFor="document-search">
              <span className="sr-only">Search documents</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                id="document-search"
                name="q"
                type="search"
                defaultValue={query ?? ""}
                maxLength={80}
                placeholder="Search by title, organization, or file name"
                className="min-h-13 w-full rounded-full border border-line-strong bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-4 focus:ring-brand-wash"
              />
            </label>
            <button
              type="submit"
              className="min-h-13 rounded-full bg-brand-strong px-6 text-sm font-extrabold text-white"
            >
              Search
            </button>
            {query && (
              <Link
                href={documentsRoute}
                className="inline-flex min-h-13 items-center justify-center rounded-full px-4 text-sm font-bold text-ink-soft no-underline"
              >
                Clear
              </Link>
            )}
          </form>
        </section>

        <section className="mt-10" aria-labelledby="documents-heading">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2
                id="documents-heading"
                className="text-sm font-extrabold text-ink"
              >
                {query ? `Results for \"${query}\"` : "Recently added"}
              </h2>
              <p className="mt-1 text-xs text-ink-faint">
                {documents.length}{" "}
                {documents.length === 1 ? "document" : "documents"}
              </p>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-b-[2rem] bg-surface px-6 py-14 text-center">
              <FileText className="mx-auto h-7 w-7 text-brand" />
              <h3 className="mt-4 text-lg font-extrabold text-ink">
                {query ? "No matching documents." : "No documents yet."}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
                {query
                  ? "Try another title, organization, or original file name."
                  : "Upload a PDF or image to create your first source-backed analysis."}
              </p>
              <Link
                href={query ? documentsRoute : "/workspace/upload"}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-strong px-5 text-sm font-bold text-white no-underline"
              >
                {query ? "Show all documents" : "Add a document"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line border-b border-line">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="grid gap-5 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-wash px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-brand">
                        {statusLabels[document.status] ?? document.status}
                      </span>
                      <span className="text-xs capitalize text-ink-faint">
                        {categoryLabel(document.category)}
                      </span>
                      {document.requiresAction && (
                        <span className="rounded-full bg-attention-wash px-2.5 py-1 text-[0.65rem] font-extrabold text-attention">
                          Action found
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 truncate text-base font-extrabold text-ink">
                      {document.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
                      {document.organizationName && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {document.organizationName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {document.documentDate ? "Dated" : "Added"}{" "}
                        {dateFormatter.format(
                          document.documentDate ?? document.createdAt,
                        )}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/workspace/documents/${document.id}` as Route}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong px-4 text-sm font-bold text-ink no-underline"
                  >
                    View document <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
