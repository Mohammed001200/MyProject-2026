"use client";

import { CalendarDays, Check, FileText, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type ActionStatus = "OPEN" | "COMPLETED" | "DISMISSED";
const views = { OPEN: "Open", COMPLETED: "Completed", DISMISSED: "Dismissed" };

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
  status = "OPEN",
}: {
  firstName: string;
  initialActions: TodayAction[];
  status?: ActionStatus;
}) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const busy = pendingId !== null || refreshing;

  async function updateStatus(id: string, nextStatus: ActionStatus) {
    if (inFlight.current || refreshing) return;
    inFlight.current = true;
    setPendingId(id);
    setError(null);
    setNotice("");
    try {
      const response = await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("Action update rejected");
      setNotice(
        nextStatus === "OPEN"
          ? "Action reopened. Find it under Open."
          : `Action ${nextStatus.toLowerCase()}. You can reopen it from ${views[nextStatus]}.`,
      );
      startTransition(() => router.refresh());
    } catch {
      setError("The action could not be updated. Please try again.");
    } finally {
      inFlight.current = false;
      setPendingId(null);
    }
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
          Review what needs attention, or return to an action you have finished.
        </p>
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Action status">
          {(Object.entries(views) as [ActionStatus, string][]).map(
            ([value, label]) => (
              <Link
                key={value}
                href={`/workspace/today?status=${value}` as Route}
                aria-current={status === value ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold no-underline ${status === value ? "bg-brand-strong text-white" : "border border-line-strong text-ink"}`}
              >
                {label}
              </Link>
            ),
          )}
        </nav>
        <p role="status" className="mt-4 text-sm text-ink-soft">
          {notice}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
        <section
          aria-label={`${views[status]} actions`}
          aria-busy={busy}
          className="mt-6 divide-y divide-line border-y border-line"
        >
          {initialActions.length === 0 ? (
            <div className="py-14 text-center">
              <Check className="mx-auto h-7 w-7 text-brand" />
              <h2 className="mt-4 text-lg font-extrabold text-ink">
                {status === "OPEN"
                  ? "Nothing needs your attention."
                  : `No ${status.toLowerCase()} actions yet.`}
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {status === "OPEN"
                  ? "New source-backed actions will appear here."
                  : "Actions you move here remain available to reopen."}
              </p>
            </div>
          ) : (
            initialActions.map((action) => (
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
                <div className="flex flex-wrap gap-2">
                  {status === "OPEN" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateStatus(action.id, "COMPLETED")}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong px-4 text-sm font-bold text-ink disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> Complete
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateStatus(action.id, "DISMISSED")}
                        className="min-h-11 rounded-full px-4 text-sm font-bold text-ink-soft disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(action.id, "OPEN")}
                      className="min-h-11 rounded-full border border-line-strong px-4 text-sm font-bold text-ink disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
        {initialActions.length === 100 && (
          <p className="mt-4 text-xs text-ink-faint">
            Showing the first 100 {status.toLowerCase()} actions.
          </p>
        )}
      </div>
    </main>
  );
}
