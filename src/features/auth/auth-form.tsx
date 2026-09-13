"use client";

import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";
type Availability = "ready" | "missing" | "invalid";

type AuthFormProps = {
  mode: AuthMode;
  availability: Availability;
  accountCreated?: boolean;
};

type FormState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

function unavailableMessage(availability: Availability) {
  if (availability === "invalid") {
    return "Sign-in is paused because this environment needs an authentication configuration fix.";
  }

  return "Sign-in is not enabled in this preview environment yet. The product preview remains available without an account.";
}

export function AuthForm({
  mode,
  availability,
  accountCreated = false,
}: AuthFormProps) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const [pending, setPending] = useState(false);
  const [formState, setFormState] = useState<FormState>(
    accountCreated
      ? {
          kind: "success",
          message: "Account created. Sign in to continue.",
        }
      : { kind: "idle" },
  );

  const isSignUp = mode === "sign-up";
  const enabled = availability === "ready";
  const interactive = enabled && hydrated;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!interactive || pending) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    setFormState({ kind: "idle" });

    try {
      if (isSignUp) {
        const name = String(form.get("name") ?? "").trim();
        const confirmation = String(form.get("passwordConfirmation") ?? "");

        if (password !== confirmation) {
          setFormState({
            kind: "error",
            message: "The two passwords do not match.",
          });
          return;
        }

        const result = await authClient.signUp.email({
          name,
          email,
          password,
        });

        if (result.error) {
          setFormState({
            kind: "error",
            message:
              "We could not create the account. Check the details or use a different email address.",
          });
          return;
        }

        router.replace("/auth/sign-in?created=1");
        router.refresh();
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/onboarding",
      });

      if (result.error) {
        setFormState({
          kind: "error",
          message: "The email or password was not accepted.",
        });
        return;
      }

      router.replace("/onboarding");
      router.refresh();
    } catch {
      setFormState({
        kind: "error",
        message:
          "CIVORA could not reach the authentication service. Try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <p className="eyebrow text-brand">
        {isSignUp ? "Create your workspace" : "Welcome back"}
      </p>
      <h1 className="display-type text-balance mt-4 text-5xl font-medium leading-[0.96] tracking-[-0.04em] text-ink sm:text-6xl">
        {isSignUp ? "Start with clarity." : "Continue calmly."}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-ink-soft sm:text-base">
        {isSignUp
          ? "Create the private account that will own your first personal workspace."
          : "Sign in to return to your CIVORA workspace."}
      </p>

      {!enabled && (
        <div
          className="mt-7 flex gap-3 rounded-2xl border border-attention/25 bg-attention-wash px-4 py-3.5 text-sm leading-6 text-ink"
          role="status"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-attention" />
          <p>
            {unavailableMessage(availability)}{" "}
            <Link href="/app/today" className="font-extrabold text-brand">
              Open preview
            </Link>
          </p>
        </div>
      )}

      {formState.kind !== "idle" && (
        <div
          className={`mt-7 flex gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${
            formState.kind === "error"
              ? "border-danger/25 bg-danger-wash text-ink"
              : "border-success/25 bg-brand-wash text-ink"
          }`}
          role={formState.kind === "error" ? "alert" : "status"}
        >
          {formState.kind === "error" ? (
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          ) : (
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          )}
          <p>{formState.message}</p>
        </div>
      )}

      <form className="mt-8 grid gap-5" onSubmit={submit}>
        {isSignUp && (
          <label
            className="grid gap-2 text-sm font-bold text-ink"
            htmlFor="name"
          >
            Full name
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              disabled={!interactive || pending}
              className="h-13 rounded-xl border border-line-strong bg-surface px-4 text-base font-medium text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand disabled:cursor-not-allowed disabled:opacity-55"
              placeholder="Your name"
            />
          </label>
        )}

        <label
          className="grid gap-2 text-sm font-bold text-ink"
          htmlFor="email"
        >
          Email
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={!interactive || pending}
            className="h-13 rounded-xl border border-line-strong bg-surface px-4 text-base font-medium text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand disabled:cursor-not-allowed disabled:opacity-55"
            placeholder="you@example.com"
          />
        </label>

        <label
          className="grid gap-2 text-sm font-bold text-ink"
          htmlFor="password"
        >
          <span className="flex items-center justify-between gap-4">
            Password
            {isSignUp && (
              <span className="text-xs font-medium text-ink-faint">
                At least 12 characters
              </span>
            )}
          </span>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={12}
            maxLength={128}
            disabled={!interactive || pending}
            className="h-13 rounded-xl border border-line-strong bg-surface px-4 text-base font-medium text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand disabled:cursor-not-allowed disabled:opacity-55"
            placeholder="••••••••••••"
          />
        </label>

        {isSignUp && (
          <label
            className="grid gap-2 text-sm font-bold text-ink"
            htmlFor="passwordConfirmation"
          >
            Confirm password
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              disabled={!interactive || pending}
              className="h-13 rounded-xl border border-line-strong bg-surface px-4 text-base font-medium text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand disabled:cursor-not-allowed disabled:opacity-55"
              placeholder="••••••••••••"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={!interactive || pending}
          className="mt-1 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-strong px-6 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(15,80,69,0.22)] transition hover:-translate-y-0.5 hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            <>
              {isSignUp ? "Create account" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {isSignUp && (
        <p className="mt-5 text-center text-xs leading-5 text-ink-faint">
          By creating an account, you agree to the{" "}
          <Link href="/terms" className="font-bold text-ink-soft">
            Terms
          </Link>{" "}
          and acknowledge the{" "}
          <Link href="/privacy" className="font-bold text-ink-soft">
            Privacy notice
          </Link>
          .
        </p>
      )}

      <p className="mt-8 border-t border-line pt-6 text-center text-sm text-ink-soft">
        {isSignUp ? "Already have an account?" : "New to CIVORA?"}{" "}
        <Link
          href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
          className="font-extrabold text-brand no-underline hover:text-brand-strong"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
