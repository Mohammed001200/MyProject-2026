"use client";
import type { Locale } from "@/features/localization/messages";
import { securityMessages } from "@/features/localization/security-messages";

import { useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ChangePassword({ locale = "en" }: { locale?: Locale }) {
  const text = securityMessages[locale].password;
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
      setMessage(text.length);
      return;
    }
    if (newPassword !== confirmation) {
      setMessage(text.mismatch);
      return;
    }
    if (currentPassword === newPassword) {
      setMessage(text.different);
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
            ? text.limited
            : result.error.status === 401
              ? text.expired
              : result.error.code === "INVALID_PASSWORD"
                ? text.incorrect
                : text.unknown,
        );
        return;
      }
      element.reset();
      setFailed(false);
      setMessage(text.success);
    } catch {
      setMessage(text.network);
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
        {text.heading}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{text.description}</p>
      <form onSubmit={submit} aria-label={text.heading} className="mt-5">
        <fieldset disabled={pending} className="grid gap-4 disabled:opacity-60">
          <label className="text-sm font-bold text-ink">
            {text.current}
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
            {text.newPassword}
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
            {text.confirm}
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
            {pending ? text.pending : text.heading}
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
