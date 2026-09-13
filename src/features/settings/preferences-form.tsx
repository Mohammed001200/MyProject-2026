"use client";

import { useActionState, useState } from "react";
import { savePreferences, type SettingsState } from "./actions";

const initialState: SettingsState = { status: "idle" };
type Preferences = {
  preferredLocale: string;
  explanationStyle: string;
  timezone: string;
};

export function PreferencesForm({ preferences }: { preferences: Preferences }) {
  const [values, setValues] = useState(preferences);
  const [state, action, pending] = useActionState(
    savePreferences,
    initialState,
  );
  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base text-ink";
  return (
    <form action={action} aria-label="Preferences" className="mt-8">
      <fieldset disabled={pending} className="grid gap-6 disabled:opacity-60">
        <label className="text-sm font-bold text-ink">
          Preferred language
          <select
            name="preferredLocale"
            value={values.preferredLocale}
            onChange={(event) =>
              setValues({ ...values, preferredLocale: event.target.value })
            }
            className={inputClass}
          >
            <option value="en">English</option>
            <option value="sv">Svenska</option>
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Explanation style
          <select
            name="explanationStyle"
            value={values.explanationStyle}
            onChange={(event) =>
              setValues({ ...values, explanationStyle: event.target.value })
            }
            className={inputClass}
          >
            <option value="SIMPLE">Simple</option>
            <option value="BALANCED">Balanced</option>
            <option value="DETAILED">Detailed</option>
          </select>
        </label>
        <div>
          <label
            htmlFor="settings-timezone"
            className="text-sm font-bold text-ink"
          >
            Time zone
          </label>
          <input
            id="settings-timezone"
            name="timezone"
            required
            maxLength={64}
            value={values.timezone}
            onChange={(event) =>
              setValues({ ...values, timezone: event.target.value })
            }
            placeholder="Europe/Stockholm"
            aria-describedby="timezone-help"
            className={inputClass}
          />
          <span
            id="timezone-help"
            className="mt-2 block text-xs font-normal text-ink-soft"
          >
            For example, Europe/Stockholm or UTC.
          </span>
        </div>
        <button
          type="submit"
          className="min-h-11 justify-self-start rounded-full bg-brand-strong px-6 py-3 text-sm font-bold text-white"
        >
          {pending ? "Saving…" : "Save preferences"}
        </button>
      </fieldset>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className="mt-4 text-sm text-ink"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
