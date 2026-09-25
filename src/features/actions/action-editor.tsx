"use client";

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
  action,
  onSaved,
  onCancel,
}: {
  action?: EditableAction;
  onSaved: () => void;
  onCancel: () => void;
}) {
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
      setError("Enter a title and a valid date, or leave the date empty.");
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
      setError(
        "Your action could not be saved. Your changes are still here; please try again.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base font-medium text-ink";
  return (
    <form
      aria-label={action ? "Edit action" : "Create action"}
      onSubmit={submit}
      className="my-6 rounded-2xl border border-line-strong bg-surface p-5 sm:p-6"
    >
      <h2 className="text-lg font-extrabold text-ink">
        {action ? "Edit action" : "Add an action"}
      </h2>
      {action?.sourceDocument && (
        <p className="mt-2 text-sm text-ink-soft">
          Your changes update this action. The original document and its
          evidence stay available.
        </p>
      )}
      <fieldset
        disabled={pending}
        className="mt-5 grid gap-4 disabled:opacity-60"
      >
        <label htmlFor={`${id}-title`} className="text-sm font-bold text-ink">
          Title
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
          Notes
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
            Priority
            <select
              id={`${id}-priority`}
              name="priority"
              defaultValue={action?.priority ?? "NORMAL"}
              className={inputClass}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>
          <label htmlFor={`${id}-date`} className="text-sm font-bold text-ink">
            Due date (optional)
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
            {pending ? "Saving…" : "Save action"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-full border border-line-strong px-5 text-sm font-bold text-ink"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
