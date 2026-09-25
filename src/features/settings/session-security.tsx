"use client";
import { useActionState } from "react";
import { signOutOtherDevices } from "./session-actions";
import type { SettingsState } from "./actions";
const initial: SettingsState = { status: "idle" };

export function SessionSecurity() {
  const [state, action, pending] = useActionState(signOutOtherDevices, initial);
  return (
    <section
      aria-labelledby="sessions-heading"
      className="mt-12 border-t border-line pt-8"
    >
      <h2 id="sessions-heading" className="text-xl font-bold text-ink">
        Account security
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Signed in on a shared or lost device? Sign out your other sessions. The
        session you are using now stays active. Anyone who knows your password
        can still sign in again.
      </p>
      <form
        action={action}
        aria-label="Sign out other devices"
        className="mt-4"
      >
        <fieldset disabled={pending} className="disabled:opacity-60">
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="confirm"
              value="yes"
              required
              className="size-5 accent-brand"
            />
            Sign out all my other sessions
          </label>
          <button
            type="submit"
            className="mt-3 min-h-11 rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-ink"
          >
            {pending ? "Signing out…" : "Sign out other devices"}
          </button>
        </fieldset>
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className="mt-3 text-sm text-ink"
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
