import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-[72px] max-w-[1040px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <ThemeToggle />
        </div>
      </header>
      <article className="mx-auto max-w-[820px] px-5 py-16 sm:px-8 sm:py-24">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-ink-soft no-underline hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CIVORA
        </Link>
        <p className="eyebrow mt-12 text-brand">{eyebrow}</p>
        <h1 className="display-type mt-4 text-5xl font-medium tracking-[-0.04em] text-ink sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          {intro}
        </p>
        <div className="mt-12 rounded-2xl border border-attention/25 bg-attention-wash p-4 text-xs leading-6 text-attention">
          <strong>Pre-launch document:</strong> this is an engineering
          placeholder, not final legal advice or a claim of completed
          compliance. Professional legal review is required before commercial
          launch.
        </div>
        <div className="mt-12 space-y-10 text-sm leading-7 text-ink-soft [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_h2]:tracking-tight [&_p]:mt-3">
          {children}
        </div>
      </article>
    </main>
  );
}
