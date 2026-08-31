"use client";

import { ArrowRight, CircleAlert, Languages, TextQuote } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  completeOnboarding,
  type OnboardingActionState,
} from "@/features/onboarding/actions";

const initialState: OnboardingActionState = { status: "idle" };

const languages = [
  { value: "en", label: "English", detail: "Product language" },
  { value: "sv", label: "Svenska", detail: "Produktspråk" },
] as const;

const explanationStyles = [
  {
    value: "SIMPLE",
    label: "Simple",
    detail: "Short sentences and less jargon.",
  },
  {
    value: "BALANCED",
    label: "Balanced",
    detail: "Clear context with practical detail.",
  },
  {
    value: "DETAILED",
    label: "Detailed",
    detail: "More nuance and supporting context.",
  },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-strong px-6 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(15,80,69,0.22)] transition hover:-translate-y-0.5 hover:bg-brand disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Saving your space…" : "Enter my workspace"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function OnboardingForm({ firstName }: { firstName: string }) {
  const [state, formAction] = useActionState(completeOnboarding, initialState);
  const timezoneInput = useRef<HTMLInputElement>(null);
  const timezoneLabel = useRef<HTMLElement>(null);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;
    if (timezoneInput.current) timezoneInput.current.value = detected;
    if (timezoneLabel.current) timezoneLabel.current.textContent = detected;
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-5">
        <p className="eyebrow text-brand">Personalize CIVORA</p>
        <span className="font-mono text-[0.68rem] font-bold text-ink-faint">
          01 / 01
        </span>
      </div>
      <h1 className="display-type text-balance mt-4 text-5xl font-medium leading-[0.96] tracking-[-0.04em] text-ink sm:text-6xl">
        Make it yours,
        <span className="block italic text-brand">{firstName}.</span>
      </h1>
      <p className="mt-5 text-sm leading-6 text-ink-soft sm:text-base">
        Two choices shape how CIVORA communicates. You can change both later.
      </p>

      {state.status === "error" && (
        <div
          className="mt-7 flex gap-3 rounded-2xl border border-danger/25 bg-danger-wash px-4 py-3.5 text-sm leading-6 text-ink"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <p>{state.message}</p>
        </div>
      )}

      <form action={formAction} className="mt-9 grid gap-9">
        <input
          ref={timezoneInput}
          type="hidden"
          name="timezone"
          defaultValue="UTC"
        />

        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Languages className="h-4 w-4 text-brand" />
            Product language
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {languages.map((language, index) => (
              <label key={language.value} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="preferredLocale"
                  value={language.value}
                  defaultChecked={index === 0}
                />
                <span className="block min-h-24 rounded-2xl border border-line-strong bg-surface p-4 transition peer-checked:border-brand peer-checked:bg-brand-wash peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand">
                  <span className="block text-sm font-extrabold text-ink">
                    {language.label}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-ink-soft">
                    {language.detail}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <TextQuote className="h-4 w-4 text-brand" />
            Explanation style
          </legend>
          <div className="mt-3 grid gap-2.5">
            {explanationStyles.map((style) => (
              <label key={style.value} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="explanationStyle"
                  value={style.value}
                  defaultChecked={style.value === "BALANCED"}
                />
                <span className="grid min-h-18 grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-line-strong bg-surface px-4 py-3 transition peer-checked:border-brand peer-checked:bg-brand-wash peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand">
                  <span>
                    <span className="block text-sm font-extrabold text-ink">
                      {style.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-ink-soft">
                      {style.detail}
                    </span>
                  </span>
                  <span className="h-4 w-4 rounded-full border-2 border-line-strong bg-surface peer-checked:border-[5px] peer-checked:border-brand" />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="text-xs leading-5 text-ink-faint">
            Deadlines will use{" "}
            <strong ref={timezoneLabel} className="text-ink-soft">
              your browser time zone
            </strong>
            .
          </p>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
