import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const principles = [
  {
    icon: FileCheck2,
    title: "Evidence stays attached",
    copy: "Explanations and actions remain traceable to the source document.",
  },
  {
    icon: ShieldCheck,
    title: "A private workspace",
    copy: "Every persisted record is designed around explicit membership.",
  },
] as const;

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-canvas lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <div className="civora-grid pointer-events-none absolute inset-0 opacity-40 lg:hidden" />

      <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#12342d] px-12 py-10 text-white lg:flex lg:min-h-dvh lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute -right-32 top-[-5rem] h-[32rem] w-[32rem] rounded-full bg-brand-bright/13 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative [&_a]:text-white [&_svg]:text-brand-bright">
          <Brand />
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <p className="eyebrow text-brand-bright">Your calm control layer</p>
          <h1 className="display-type text-balance mt-5 text-6xl font-medium leading-[0.91] tracking-[-0.045em] xl:text-7xl">
            Important things,
            <span className="block italic text-[#b6e37b]">
              made manageable.
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#b9ccc5]">
            CIVORA helps you understand what arrived, remember what matters, and
            take the next step with confidence.
          </p>

          <div className="mt-12 grid gap-2 border-t border-white/12 pt-4">
            {principles.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="grid grid-cols-[42px_1fr] gap-4 border-b border-white/10 py-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-brand-bright">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#9fb7ae]">
                    {copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[#8ea79e]">
          Private beta foundation · No certification claims
        </p>
      </section>

      <section className="relative flex min-h-dvh flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-12 sm:py-16">
          {children}
        </div>

        <div className="mx-auto flex w-full max-w-[470px] items-center justify-between border-t border-line pt-5 text-xs text-ink-faint">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg font-bold no-underline transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back home
          </Link>
          <span>Encrypted transport in production</span>
        </div>
      </section>
    </main>
  );
}
