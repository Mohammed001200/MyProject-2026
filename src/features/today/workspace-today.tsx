"use client";
import { todayMessages } from "@/features/localization/today-messages";
import type { Locale } from "@/features/localization/messages";

import type { Deadline } from "./deadline";
import { ActionEditor } from "@/features/actions/action-editor";
import { CalendarDays, Check, FileText, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type ActionStatus = "OPEN" | "COMPLETED" | "DISMISSED";

type TodayAction = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueAt: string | null;
  deadline?: Deadline | null;
  sourceDateText: string | null;
  sourceDocument: { id: string; title: string } | null;
};

export function WorkspaceToday({
  locale = "en",
  firstName,
  initialActions,
  status = "OPEN",
}: {
  locale?: Locale;
  firstName: string;
  initialActions: TodayAction[];
  status?: ActionStatus;
}) {
  const text = todayMessages[locale];
  const views = text.views;
  const priorities: Record<string, string> = {
    LOW: text.low,
    NORMAL: text.normal,
    HIGH: text.high,
    URGENT: text.urgent,
  };
  const router = useRouter();
  const [editor, setEditor] = useState<TodayAction | "new" | null>(null);
  const [refreshing, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const busy = pendingId !== null || refreshing || editor !== null;

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
      setNotice(text.notices[nextStatus]);
      startTransition(() => router.refresh());
    } catch {
      setError(text.updateError);
    } finally {
      inFlight.current = false;
      setPendingId(null);
    }
  }

  return (
    <main
      lang={locale}
      className="min-h-dvh bg-canvas px-5 py-8 sm:px-8 sm:py-12"
    >
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
            <Plus className="h-4 w-4" /> {text.addDocument}
          </Link>
        </div>
        <p className="eyebrow mt-16 text-brand">{text.today}</p>
        <h1 className="display-type mt-4 text-5xl font-medium tracking-[-0.04em] text-ink sm:text-6xl">
          {text.greeting} {firstName}.
        </h1>
        <p className="mt-4 text-base text-ink-soft">{text.description}</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditor("new")}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-bold text-ink disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {text.addAction}
        </button>
        {editor && (
          <ActionEditor
            locale={locale}
            key={editor === "new" ? "new" : editor.id}
            action={editor === "new" ? undefined : editor}
            onCancel={() => setEditor(null)}
            onSaved={() => {
              setEditor(null);
              setNotice(text.saved);
              startTransition(() => router.refresh());
            }}
          />
        )}
        <nav
          className="mt-8 flex flex-wrap gap-2"
          aria-label={text.statusLabel}
        >
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
          aria-label={text.regions[status]}
          aria-busy={busy}
          className="mt-6 divide-y divide-line border-y border-line"
        >
          {initialActions.length === 0 ? (
            <div className="py-14 text-center">
              <Check className="mx-auto h-7 w-7 text-brand" />
              <h2 className="mt-4 text-lg font-extrabold text-ink">
                {text.empty[status]}
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {status === "OPEN" ? text.openHelp : text.closedHelp}
              </p>
            </div>
          ) : (
            initialActions.map((action) => (
              <article
                key={action.id}
                className="grid gap-5 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-attention-wash px-2.5 py-1 text-[0.65rem] font-extrabold text-attention">
                      {priorities[action.priority] ?? action.priority}
                    </span>
                    {status === "OPEN" && action.deadline?.label && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${action.deadline.label === "Overdue" ? "bg-danger-wash text-danger" : "bg-attention-wash text-attention"}`}
                      >
                        {text.deadlines[action.deadline.label]}
                      </span>
                    )}
                    {(action.dueAt || action.sourceDateText) && (
                      <span className="flex items-center gap-1 text-xs text-ink-faint">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {action.dueAt
                          ? `${text.due} ${action.deadline?.date ?? action.dueAt.slice(0, 10)}`
                          : action.sourceDateText}
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
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditor(action)}
                    className="min-h-11 rounded-full border border-line-strong px-4 text-sm font-bold text-ink disabled:opacity-50"
                  >
                    {text.edit}
                  </button>
                  {status === "OPEN" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateStatus(action.id, "COMPLETED")}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong px-4 text-sm font-bold text-ink disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> {text.complete}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateStatus(action.id, "DISMISSED")}
                        className="min-h-11 rounded-full px-4 text-sm font-bold text-ink-soft disabled:opacity-50"
                      >
                        {text.dismiss}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(action.id, "OPEN")}
                      className="min-h-11 rounded-full border border-line-strong px-4 text-sm font-bold text-ink disabled:opacity-50"
                    >
                      {text.reopen}
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
        {initialActions.length === 100 && (
          <p className="mt-4 text-xs text-ink-faint">{text.limits[status]}</p>
        )}
      </div>
    </main>
  );
}
