"use client";

import { ArrowLeft, RotateCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";

export function ServiceUnavailable({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-12">
      <div className="w-full max-w-lg rounded-[2rem] border border-line bg-surface p-7 shadow-soft sm:p-9">
        <Brand />
        <span className="mt-12 grid h-12 w-12 place-items-center rounded-2xl bg-attention-wash text-attention">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <p className="eyebrow mt-7 text-attention">Service unavailable</p>
        <h1 className="display-type mt-3 text-4xl font-medium leading-none tracking-[-0.035em] text-ink">
          Your data stayed untouched.
        </h1>
        <p className="mt-5 text-sm leading-6 text-ink-soft">
          CIVORA could not safely establish the private workspace connection.
          Nothing was submitted. Try again after the service recovers.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-strong px-5 text-sm font-extrabold text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-sm font-extrabold text-ink no-underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
