"use client";
import { documentMessages } from "@/features/localization/document-messages";
import type { Locale } from "@/features/localization/messages";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import type { Citation } from "@/server/chat/schema";
export type ChatTurnView = {
  id: string;
  question: string;
  answer: string | null;
  status: string;
  citations: Citation[];
  createdAt: string;
};
export function DocumentChat({
  locale = "en",
  documentId,
  title,
  initialTurns,
}: {
  locale?: Locale;
  documentId: string;
  title: string;
  initialTurns: ChatTurnView[];
}) {
  const text = documentMessages[locale];
  const errors: Record<string, string> = text.errors;
  const [turns, setTurns] = useState(initialTurns);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const request = useRef<{ question: string; id: string } | null>(null);
  const busy = useRef(false);
  const hasPending = turns.some((turn) => turn.status === "PENDING");
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/chat`);
        if (response.ok) setTurns((await response.json()).turns);
        else {
          setError(text.unavailable);
          clearInterval(timer);
        }
      } catch {
        /* A later poll can recover a temporary network failure. */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [documentId, hasPending, text.unavailable]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !question.trim()) return;
    busy.current = true;
    setPending(true);
    setError("");
    const questionText = question.trim();
    if (request.current?.question !== questionText)
      request.current = { question: questionText, id: crypto.randomUUID() };
    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          requestId: request.current.id,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status !== 500) request.current = null;
        setError(errors[result.code] ?? text.answerFailed);
        return;
      }
      setTurns(result.turns);
      setQuestion("");
      request.current = null;
    } catch {
      setError(text.connection);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function clear() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(text.clearFailed);
        return;
      }
      setTurns([]);
      setConfirmClear(false);
      request.current = null;
    } catch {
      setError(text.clearFailed);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <main lang={locale} className="min-h-dvh bg-canvas px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={"/workspace/ai" as Route}
          className="inline-flex min-h-11 items-center text-sm font-bold text-brand"
        >
          {text.select}
        </Link>
        <h1 className="display-type mt-5 text-4xl text-ink">{text.ask}</h1>
        <p className="mt-3 text-sm text-ink-soft">
          {text.selected}{" "}
          <Link
            className="underline"
            href={`/workspace/documents/${documentId}` as Route}
          >
            {title}
          </Link>
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{text.chatHelp}</p>
        <div className="mt-8 space-y-6" aria-label={text.conversation}>
          {turns.length === 0 && (
            <p className="rounded-2xl border border-line p-6 text-ink-soft">
              {text.suggestion}
            </p>
          )}
          {turns.map((turn) => (
            <article key={turn.id} className="border-b border-line pb-6">
              <h2 className="whitespace-pre-wrap break-words font-bold text-ink">
                {turn.question}
              </h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-ink-soft">
                {turn.status === "COMPLETE"
                  ? turn.answer
                  : turn.status === "FAILED"
                    ? text.interrupted
                    : text.preparing}
              </p>
              {turn.citations.map((source) => (
                <details key={source.id} className="mt-3 text-sm text-ink-soft">
                  <summary className="min-h-11 cursor-pointer py-3 font-bold text-brand">
                    {source.label}
                    {source.page ? ` · ${text.page} ${source.page}` : ""}
                  </summary>
                  <blockquote className="border-l-2 border-brand pl-4">
                    {source.text}
                  </blockquote>
                  <Link
                    className="mt-2 inline-flex min-h-11 items-center underline"
                    href={`/workspace/documents/${documentId}` as Route}
                  >
                    {text.openSource}
                  </Link>
                </details>
              ))}
            </article>
          ))}
        </div>
        <form onSubmit={send} className="mt-8">
          <label htmlFor="chat-question" className="font-bold text-ink">
            {text.question}
          </label>
          <textarea
            id="chat-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={pending}
            required
            maxLength={2000}
            rows={3}
            className="mt-2 w-full rounded-xl border border-line-strong bg-surface p-4 text-base text-ink"
          />
          <button
            disabled={pending || hasPending || !question.trim()}
            className="mt-3 min-h-11 rounded-full bg-brand-strong px-6 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? text.working : text.send}
          </button>
        </form>
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {pending ? text.savingAnswer : ""}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        {turns.length > 0 && (
          <div className="mt-8">
            {confirmClear ? (
              <div role="group" aria-label={text.clearHistory}>
                <p className="text-sm text-ink">{text.clearConfirm}</p>
                <button
                  onClick={clear}
                  disabled={pending}
                  className="min-h-11 px-4 text-danger"
                >
                  {text.clearPermanent}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="min-h-11 px-4 text-ink"
                >
                  {text.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={pending}
                className="min-h-11 text-sm text-ink-soft underline"
              >
                {text.clearHistory}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
