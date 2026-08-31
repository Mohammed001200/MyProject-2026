"use client";

import { CalendarDays, Check, FileText, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

type TodayAction = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueAt: string | null;
  sourceDateText: string | null;
  sourceDocument: { id: string; title: string } | null;
};

export function WorkspaceToday({
  firstName,
  initialActions,
}: {
  firstName: string;
  initialActions: TodayAction[];
}) {
  const [actions, setActions] = useState(initialActions);

  async function complete(id: string) {
    const response = await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (response.ok)
      setActions((current) => current.filter((action) => action.id !== id));
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/workspace"
            className="text-sm font-extrabold text-brand no-underline"
          >
            CIVORA
          </Link>
          <Link
            href="/workspace/upload"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-strong px-4 text-sm font-bold text-white no-underline"
          >
            <Plus className="h-4 w-4" /> Add document
          </Link>
        </div>
        <p className="eyebrow mt-16 text-brand">Today</p>
        <h1 className="display-type mt-4 text-5xl font-medium tracking-[-0.04em] text-ink sm:text-6xl">
          What matters, {firstName}.
        </h1>
        <p className="mt-4 text-base text-ink-soft">
          Real actions from your authorized workspace, ordered by urgency.
        </p>
        <section className="mt-12 divide-y divide-line border-y border-line">
          {actions.length === 0 ? (
            <div className="py-14 text-center">
              <Check className="mx-auto h-7 w-7 text-brand" />
              <h2 className="mt-4 text-lg font-extrabold text-ink">
                Nothing needs your attention.
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                New source-backed actions will appear here.
              </p>
            </div>
          ) : (
            actions.map((action) => (
              <article
                key={action.id}
                className="grid gap-5 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-attention-wash px-2.5 py-1 text-[0.65rem] font-extrabold text-attention">
                      {action.priority}
                    </span>
                    {action.sourceDateText && (
                      <span className="flex items-center gap-1 text-xs text-ink-faint">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {action.sourceDateText}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-base font-extrabold text-ink">
                    {action.title}
                  </h2>
                  {action.description && (
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      {action.description}
                    </p>
                  )}
                  {action.sourceDocument && (
                    <Link
                      href={
                        `/workspace/documents/${action.sourceDocument.id}` as Route
                      }
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {action.sourceDocument.title}
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => complete(action.id)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong px-4 text-sm font-bold text-ink"
                >
                  <Check className="h-4 w-4" /> Complete
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
