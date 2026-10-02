"use client";
import { todayMessages } from "@/features/localization/today-messages";
import type { Locale } from "@/features/localization/messages";

import { useId, useRef, useState, type FormEvent } from "react";
import { actionDetailsSchema } from "./schema";

type EditableAction = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueAt: string | null;
  sourceDocument?: { id: string; title: string } | null;
};

export function ActionEditor({
  locale = "en",
  action,
  onSaved,
  onCancel,
}: {
  locale?: Locale;
  action?: EditableAction;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const text = todayMessages[locale];
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const input = actionDetailsSchema.safeParse({
      title: form.get("title"),
      description: form.get("description") || null,
      priority: form.get("priority"),
      dueDate: form.get("dueDate") || null,
    });
    if (!input.success) {
      setError(text.invalid);
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        action ? `/api/actions/${action.id}` : "/api/actions",
        {
          method: action ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input.data),
        },
      );
      if (!response.ok) throw new Error("Action save failed");
      onSaved();
    } catch {
      setError(text.saveError);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base font-medium text-ink";
  return (
    <form
      aria-label={action ? text.editAction : text.createAction}
      onSubmit={submit}
      className="my-6 rounded-2xl border border-line-strong bg-surface p-5 sm:p-6"
    >
      <h2 className="text-lg font-extrabold text-ink">
        {action ? text.editAction : text.addHeading}
      </h2>
      {action?.sourceDocument && (
        <p className="mt-2 text-sm text-ink-soft">{text.evidence}</p>
      )}
      <fieldset
        disabled={pending}
        className="mt-5 grid gap-4 disabled:opacity-60"
      >
        <label htmlFor={`${id}-title`} className="text-sm font-bold text-ink">
          {text.title}
          <input
            id={`${id}-title`}
            name="title"
            required
            maxLength={200}
            defaultValue={action?.title ?? ""}
            className={inputClass}
          />
        </label>
        <label
          htmlFor={`${id}-description`}
          className="text-sm font-bold text-ink"
        >
          {text.notes}
          <textarea
            id={`${id}-description`}
            name="description"
            rows={3}
            maxLength={4000}
            defaultValue={action?.description ?? ""}
            className={inputClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label
            htmlFor={`${id}-priority`}
            className="text-sm font-bold text-ink"
          >
            {text.priority}
            <select
              id={`${id}-priority`}
              name="priority"
              defaultValue={action?.priority ?? "NORMAL"}
              className={inputClass}
            >
              <option value="LOW">{text.low}</option>
              <option value="NORMAL">{text.normal}</option>
              <option value="HIGH">{text.high}</option>
              <option value="URGENT">{text.urgent}</option>
            </select>
          </label>
          <label htmlFor={`${id}-date`} className="text-sm font-bold text-ink">
            {text.dueDate}
            <input
              id={`${id}-date`}
              name="dueDate"
              type="date"
              defaultValue={action?.dueAt?.slice(0, 10) ?? ""}
              className={inputClass}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-h-11 rounded-full bg-brand-strong px-5 text-sm font-bold text-white"
          >
            {pending ? text.saving : text.save}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-full border border-line-strong px-5 text-sm font-bold text-ink"
          >
            {text.cancel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
