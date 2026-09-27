"use client";
import { useActionState } from "react";
import Link from "next/link";
import { deleteAccount } from "./delete-account-action";
import type { SettingsState } from "./actions";
const initial: SettingsState = { status: "idle" };
export function DeleteAccount() {
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
          Return home
        </Link>
      </section>
    );
  return (
    <section
      aria-labelledby="delete-account-heading"
      className="mt-12 border-t border-line pt-8"
    >
      <h2 id="delete-account-heading" className="text-xl font-bold text-ink">
        Delete account
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        This permanently deletes your account, preferences, personal workspace
        and remaining actions. Download your workspace data first if you want to
        keep a copy.
      </p>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        First delete all documents from your library and wait for any pending
        file deletions to finish. Accounts in shared workspaces cannot be
        deleted here yet. Retained infrastructure backups follow the configured
        retention policy.
      </p>
      <Link
        href="/workspace/documents"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-brand"
      >
        Open document library
      </Link>
      <form action={action} aria-label="Delete account" className="mt-4">
        <fieldset disabled={pending} className="grid gap-4 disabled:opacity-60">
          <label className="text-sm font-bold text-ink">
            Current password for deletion
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
            Type DELETE to confirm
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
            {pending ? "Deleting account…" : "Delete my account permanently"}
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
