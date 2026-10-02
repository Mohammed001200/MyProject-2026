"use client";
import type { Locale } from "@/features/localization/messages";
import { securityMessages } from "@/features/localization/security-messages";
import { useActionState } from "react";
import { signOutOtherDevices } from "./session-actions";
import type { SettingsState } from "./actions";
const initial: SettingsState = { status: "idle" };

export function SessionSecurity({ locale = "en" }: { locale?: Locale }) {
  const text = securityMessages[locale].sessions;
  const [state, action, pending] = useActionState(signOutOtherDevices, initial);
  return (
    <section
      aria-labelledby="sessions-heading"
      className="mt-12 border-t border-line pt-8"
    >
      <h2 id="sessions-heading" className="text-xl font-bold text-ink">
        {text.heading}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{text.description}</p>
      <form action={action} aria-label={text.submit} className="mt-4">
        <input type="hidden" name="locale" value={locale} />
        <fieldset disabled={pending} className="disabled:opacity-60">
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="confirm"
              value="yes"
              required
              className="size-5 accent-brand"
            />
            {text.confirm}
          </label>
          <button
            type="submit"
            className="mt-3 min-h-11 rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-ink"
          >
            {pending ? text.pending : text.submit}
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
