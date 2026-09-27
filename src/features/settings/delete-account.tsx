"use client";
import type { Locale } from "@/features/localization/messages";
import { securityMessages } from "@/features/localization/security-messages";
import { useActionState } from "react";
import Link from "next/link";
import { deleteAccount } from "./delete-account-action";
import type { SettingsState } from "./actions";
const initial: SettingsState = { status: "idle" };
export function DeleteAccount({ locale = "en" }: { locale?: Locale }) {
  const text = securityMessages[locale].deletion;
  const [state, action, pending] = useActionState(deleteAccount, initial);
  if (state.status === "success")
    return (
      <section className="mt-12 border-t border-line pt-8">
        <p role="status" className="text-sm text-ink">
          {state.message}
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex min-h-11 items-center font-bold text-brand"
        >
          {text.home}
        </Link>
      </section>
    );
  return (
    <section
      aria-labelledby="delete-account-heading"
      className="mt-12 border-t border-line pt-8"
    >
      <h2 id="delete-account-heading" className="text-xl font-bold text-ink">
        {text.heading}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{text.description}</p>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{text.limits}</p>
      <Link
        href="/workspace/documents"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-brand"
      >
        {text.documents}
      </Link>
      <form action={action} aria-label={text.heading} className="mt-4">
        <input type="hidden" name="locale" value={locale} />
        <fieldset disabled={pending} className="grid gap-4 disabled:opacity-60">
          <label className="text-sm font-bold text-ink">
            {text.password}
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={128}
              className="mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base"
            />
          </label>
          <label className="text-sm font-bold text-ink">
            {text.confirm}
            <input
              type="text"
              name="confirmation"
              autoComplete="off"
              spellCheck={false}
              required
              pattern="DELETE"
              className="mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base"
            />
          </label>
          <button
            type="submit"
            className="min-h-11 justify-self-start rounded-full border border-danger px-6 py-3 text-sm font-bold text-danger"
          >
            {pending ? text.pending : text.submit}
          </button>
        </fieldset>
        {state.message && (
          <p role="alert" className="mt-4 text-sm text-ink">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
