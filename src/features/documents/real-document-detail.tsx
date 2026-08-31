"use client";

import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type DocumentView = {
  id: string;
  title: string;
  status: string;
  category: string;
  organizationName: string | null;
  failureMessage: string | null;
  file: { sourceUrl: string; mimeType: string; sizeBytes: number } | null;
  analysis: null | {
    summary: string | null;
    simpleExplanation: string | null;
    importance: string;
    confidence: number | null;
    warnings: string[];
    entities: Array<{
      id: string;
      label: string;
      value: string;
      confidence: number | null;
      pageNumber: number | null;
      sourceText: string | null;
    }>;
  };
  actions: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    sourceDateText: string | null;
    generationReason: string | null;
    sourcePageNumber: number | null;
    sourceText: string | null;
  }>;
};

export function RealDocumentDetail({ documentId }: { documentId: string }) {
  const [document, setDocument] = useState<DocumentView | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      const response = await fetch(`/api/documents/${documentId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        if (!cancelled) setError(true);
        return;
      }
      const next = (await response.json()) as DocumentView;
      if (cancelled) return;
      setDocument(next);
      if (next.status === "QUEUED" || next.status === "PROCESSING") {
        timer = setTimeout(load, 1400);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [documentId]);

  if (error) {
    return (
      <p className="p-8 text-danger">
        The document could not be loaded safely.
      </p>
    );
  }

  if (
    !document ||
    document.status === "QUEUED" ||
    document.status === "PROCESSING"
  ) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas px-5">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand" />
          <h1 className="display-type mt-6 text-4xl text-ink">
            Understanding your document…
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            The private source is stored. This page updates automatically.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/workspace/today"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-soft no-underline"
          >
            <ArrowLeft className="h-4 w-4" /> Today
          </Link>
          {document.file && (
            <a
              href={document.file.sourceUrl}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-bold text-ink no-underline"
            >
              <Download className="h-4 w-4" /> Download source
            </a>
          )}
        </div>

        {document.status === "FAILED" ? (
          <div className="mt-16 rounded-3xl border border-attention/25 bg-attention-wash p-7">
            <ShieldAlert className="h-6 w-6 text-attention" />
            <h1 className="display-type mt-5 text-4xl text-ink">
              Analysis stopped safely.
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              {document.failureMessage}
            </p>
          </div>
        ) : (
          <>
            <p className="eyebrow mt-12 text-brand">
              {document.category.replaceAll("_", " ")}
            </p>
            <h1 className="display-type mt-4 text-5xl font-medium leading-none tracking-[-0.04em] text-ink sm:text-6xl">
              {document.title}
            </h1>
            <p className="mt-4 text-sm text-ink-soft">
              {document.organizationName ?? "Organization not identified"}
            </p>

            {document.status === "NEEDS_REVIEW" && (
              <section
                className="mt-8 rounded-3xl border border-attention/25 bg-attention-wash p-6"
                aria-labelledby="review-heading"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-attention" />
                  <h2 id="review-heading" className="font-extrabold text-ink">
                    Review needed before acting
                  </h2>
                </div>
                <ul className="mt-3 grid gap-2 pl-5 text-sm leading-6 text-ink-soft">
                  {document.analysis?.warnings.map((warning) => (
                    <li key={warning} className="list-disc">
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
                <p className="eyebrow text-brand">What it means</p>
                <p className="mt-5 text-lg leading-8 text-ink">
                  {document.analysis?.simpleExplanation}
                </p>
                <div className="mt-8 border-t border-line pt-6">
                  <h2 className="text-sm font-extrabold text-ink">Summary</h2>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">
                    {document.analysis?.summary}
                  </p>
                </div>
              </section>

              <section className="rounded-3xl bg-[#173c35] p-6 text-white sm:p-8">
                <p className="eyebrow text-brand-bright">Next actions</p>
                <div className="mt-5 grid gap-5">
                  {document.actions.length === 0 ? (
                    <p className="text-sm text-white/65">
                      {document.status === "NEEDS_REVIEW"
                        ? "Automatic actions are held back until the analysis can be trusted."
                        : "No action was supported by the source."}
                    </p>
                  ) : (
                    document.actions.map((action) => (
                      <article
                        key={action.id}
                        className="border-t border-white/12 pt-5"
                      >
                        <h2 className="font-extrabold">{action.title}</h2>
                        {action.sourceDateText && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-brand-bright">
                            <CalendarDays className="h-4 w-4" />{" "}
                            {action.sourceDateText}
                          </p>
                        )}
                        <p className="mt-3 text-xs leading-5 text-white/60">
                          {action.generationReason}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="mt-8 border-y border-line py-8">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-extrabold text-ink">
                  Evidence from the source
                </h2>
              </div>
              <div className="mt-5 grid gap-3">
                {document.analysis?.entities.map((entity) => (
                  <article
                    key={entity.id}
                    className="grid gap-3 rounded-2xl bg-surface p-5 sm:grid-cols-[180px_1fr]"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-ink">
                        {entity.label}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        {entity.pageNumber
                          ? `Page ${entity.pageNumber}`
                          : "Page unavailable"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {entity.value}
                      </p>
                      {entity.sourceText && (
                        <blockquote className="mt-2 border-l-2 border-brand pl-3 text-xs leading-5 text-ink-soft">
                          “{entity.sourceText}”
                        </blockquote>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
