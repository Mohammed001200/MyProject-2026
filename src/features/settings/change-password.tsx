"use client";

import { useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ChangePassword() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    setFailed(true);
    if (newPassword.length < 12 || newPassword.length > 128) {
      setMessage("Use a new password between 12 and 128 characters.");
      return;
    }
    if (newPassword !== confirmation) {
      setMessage("The new passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setMessage("Choose a different password from your current one.");
      return;
    }
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setMessage(
          result.error.status === 429
            ? "Too many attempts. Wait a moment before trying again."
            : result.error.status === 401
              ? "Your session has expired. Please sign in again."
              : result.error.code === "INVALID_PASSWORD"
                ? "Your current password was not accepted."
                : "The password change could not be confirmed. Try signing in with your new password before retrying.",
        );
        return;
      }
      element.reset();
      setFailed(false);
      setMessage("Password changed. Your other sessions have been signed out.");
    } catch {
      setMessage(
        "The connection was interrupted. The password may have changed; try signing in with your new password before retrying.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base text-ink";
  return (
    <section
      aria-labelledby="password-heading"
      className="mt-12 border-t border-line pt-8"
    >
      <h2 id="password-heading" className="text-xl font-bold text-ink">
        Change password
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Use 12–128 characters. Changing your password signs out your other
        sessions and keeps this browser signed in.
      </p>
      <form onSubmit={submit} aria-label="Change password" className="mt-5">
        <fieldset disabled={pending} className="grid gap-4 disabled:opacity-60">
          <label className="text-sm font-bold text-ink">
            Current password
            <input
              className={inputClass}
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          <label className="text-sm font-bold text-ink">
            New password
            <input
              className={inputClass}
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
          <label className="text-sm font-bold text-ink">
            Confirm new password
            <input
              className={inputClass}
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
          <button
            type="submit"
            className="min-h-11 justify-self-start rounded-full bg-brand-strong px-6 py-3 text-sm font-bold text-white"
          >
            {pending ? "Changing password…" : "Change password"}
          </button>
        </fieldset>
        {message && (
          <p
            role={failed ? "alert" : "status"}
            className="mt-4 text-sm text-ink"
          >
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
