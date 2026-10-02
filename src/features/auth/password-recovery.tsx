"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function PasswordRecovery({
  mode,
  available,
  token,
}: {
  mode: "request" | "reset";
  available: boolean;
  token?: string;
}) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !available || done) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    setError("");
    const newPassword = String(form.get("newPassword") ?? "");
    if (
      mode === "reset" &&
      (newPassword.length < 12 ||
        newPassword.length > 128 ||
        newPassword !== form.get("confirmation"))
    ) {
      setError("Use 12–128 characters and enter the same password twice.");
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      const result =
        mode === "request"
          ? await authClient.requestPasswordReset({
              email: String(form.get("email") ?? "").trim(),
              redirectTo: "/auth/reset-password",
            })
          : await authClient.resetPassword({ newPassword, token });
      if (result.error) {
        setError(
          result.error.status === 429
            ? "Too many attempts. Please wait before trying again."
            : mode === "reset"
              ? "This link may have expired or already been used. Request a new reset link."
              : "Recovery is temporarily unavailable. Please try again later.",
        );
        return;
      }
      element.reset();
      setDone(true);
      if (mode === "reset")
        window.history.replaceState(null, "", "/auth/reset-password");
    } catch {
      setError(
        mode === "reset"
          ? "We could not confirm the change. Try signing in with the new password, or request a new reset link."
          : "The request could not be confirmed. Check your inbox before trying again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink";
  return (
    <div>
      <h1 className="display-type text-5xl text-ink">
        {mode === "request" ? "Reset your password" : "Choose a new password"}
      </h1>
      {!available ? (
        <p role="status" className="mt-5 text-sm leading-6 text-ink-soft">
          {mode === "request"
            ? "Password recovery is not enabled in this environment yet."
            : "This reset link is missing or invalid. Request a new link."}
        </p>
      ) : done ? (
        <p role="status" className="mt-5 text-sm leading-6 text-ink">
          {mode === "request"
            ? "If an account matches that email, check your inbox for a reset link. If it does not arrive, check spam or try again later."
            : "Your password has been reset and existing sessions have been signed out. Sign in with your new password."}
        </p>
      ) : (
        <form
          onSubmit={submit}
          aria-label={
            mode === "request" ? "Request password reset" : "Reset password"
          }
          className="mt-6"
        >
          <fieldset
            disabled={pending}
            className="grid gap-4 disabled:opacity-60"
          >
            {mode === "request" ? (
              <label className="text-sm font-bold text-ink">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className={inputClass}
                />
              </label>
            ) : (
              <>
                <label className="text-sm font-bold text-ink">
                  New password
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-bold text-ink">
                  Confirm new password
                  <input
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    className={inputClass}
                  />
                </label>
              </>
            )}
            <button
              type="submit"
              className="min-h-11 rounded-full bg-brand-strong px-6 py-3 text-sm font-bold text-white"
            >
              {pending
                ? "Please wait…"
                : mode === "request"
                  ? "Send reset link"
                  : "Reset password"}
            </button>
          </fieldset>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-ink">
          {error}
        </p>
      )}
      <Link
        href="/auth/sign-in"
        className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-brand"
      >
        Back to sign in
      </Link>
      {mode === "reset" && !done && (
        <Link
          href="/auth/forgot-password"
          className="ml-4 inline-flex min-h-11 items-center text-sm font-bold text-brand"
        >
          Request a new link
        </Link>
      )}
    </div>
  );
}
