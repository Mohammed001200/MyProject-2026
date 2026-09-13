"use client";
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
const errors: Record<string, string> = {
  AI_NOT_CONFIGURED:
    "AI chat is not connected yet. Your documents are still available.",
  DOCUMENT_NOT_READY:
    "This document needs a completed analysis before you can chat about it.",
  CHAT_DAILY_LIMIT:
    "You have reached the limit of 50 questions in 24 hours. Try again later.",
  CHAT_HISTORY_LIMIT:
    "This conversation has reached 40 questions. Clear its history to start again.",
  CHAT_BUSY:
    "Another answer is still being prepared. Wait a moment and try again.",
  NO_DOCUMENT_EVIDENCE:
    "There is not enough extracted evidence to chat about this document.",
};
export function DocumentChat({
  documentId,
  title,
  initialTurns,
}: {
  documentId: string;
  title: string;
  initialTurns: ChatTurnView[];
}) {
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
          setError("Chat is no longer available. Return to your documents.");
          clearInterval(timer);
        }
      } catch {
        /* A later poll can recover a temporary network failure. */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [documentId, hasPending]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !question.trim()) return;
    busy.current = true;
    setPending(true);
    setError("");
    const text = question.trim();
    if (request.current?.question !== text)
      request.current = { question: text, id: crypto.randomUUID() };
    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text, requestId: request.current.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status !== 500) request.current = null;
        throw new Error(
          errors[result.code] ??
            "The answer could not be saved. Please try again.",
        );
      }
      setTurns(result.turns);
      setQuestion("");
      request.current = null;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Connection lost. Your question is still here.",
      );
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
      if (!response.ok)
        throw new Error("History could not be cleared. Please try again.");
      setTurns([]);
      setConfirmClear(false);
      request.current = null;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <main className="min-h-dvh bg-canvas px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={"/workspace/ai" as Route}
          className="inline-flex min-h-11 items-center text-sm font-bold text-brand"
        >
          Choose another document
        </Link>
        <h1 className="display-type mt-5 text-4xl text-ink">Ask CIVORA</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Selected document:{" "}
          <Link
            className="underline"
            href={`/workspace/documents/${documentId}` as Route}
          >
            {title}
          </Link>
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Answers use this document’s extracted evidence. Check the source
          before acting on important details. Your conversation is saved and is
          removed when its source document is deleted.
        </p>
        <div className="mt-8 space-y-6" aria-label="Conversation">
          {turns.length === 0 && (
            <p className="rounded-2xl border border-line p-6 text-ink-soft">
              Try: What does this document ask me to do? What deadline does it
              mention?
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
                    ? "This answer was interrupted or could not be saved. Send your question again."
                    : "Preparing an answer…"}
              </p>
              {turn.citations.map((source) => (
                <details key={source.id} className="mt-3 text-sm text-ink-soft">
                  <summary className="min-h-11 cursor-pointer py-3 font-bold text-brand">
                    {source.label}
                    {source.page ? ` · Page ${source.page}` : ""}
                  </summary>
                  <blockquote className="border-l-2 border-brand pl-4">
                    {source.text}
                  </blockquote>
                  <Link
                    className="mt-2 inline-flex min-h-11 items-center underline"
                    href={`/workspace/documents/${documentId}` as Route}
                  >
                    Open source document
                  </Link>
                </details>
              ))}
            </article>
          ))}
        </div>
        <form onSubmit={send} className="mt-8">
          <label htmlFor="chat-question" className="font-bold text-ink">
            Your question
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
            {pending ? "Working…" : "Send question"}
          </button>
        </form>
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {pending ? "Preparing and saving your answer…" : ""}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        {turns.length > 0 && (
          <div className="mt-8">
            {confirmClear ? (
              <div role="group" aria-label="Clear chat history">
                <p className="text-sm text-ink">
                  Permanently remove your questions and answers for this
                  document?
                </p>
                <button
                  onClick={clear}
                  disabled={pending}
                  className="min-h-11 px-4 text-danger"
                >
                  Clear permanently
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="min-h-11 px-4 text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={pending}
                className="min-h-11 text-sm text-ink-soft underline"
              >
                Clear chat history
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
