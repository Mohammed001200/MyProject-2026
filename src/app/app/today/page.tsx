import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AttentionList } from "@/features/today/attention-list";
import { demoDocuments } from "@/features/today/demo-data";

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pb-16">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-ink-faint">Monday, August 31</p>
          <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
            Good afternoon, Maya.
          </h1>
          <p className="mt-3 text-base text-ink-soft">
            Everything important, in one place.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.68rem] font-bold text-ink-soft shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          Fictional preview data
        </div>
      </div>

      <div className="mt-11 grid gap-9 xl:grid-cols-[minmax(0,1fr)_310px] xl:gap-12">
        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-attention">Needs attention</p>
              <h2 className="mt-2 text-lg font-extrabold text-ink">
                3 things to review
              </h2>
            </div>
            <p className="hidden text-xs text-ink-faint sm:block">
              Ordered by urgency and due date
            </p>
          </div>
          <AttentionList />

          <section className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-brand">Recently understood</p>
                <h2 className="mt-2 text-lg font-extrabold text-ink">
                  Your latest documents
                </h2>
              </div>
              <Link
                href="/app/documents"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand no-underline hover:underline"
              >
                All documents
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {demoDocuments.map((document) => (
                <div
                  key={document.id}
                  className="grid gap-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas-soft text-ink-soft">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {document.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {document.organization} · {document.understood}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-brand-wash px-2.5 py-1 text-[0.64rem] font-extrabold text-brand">
                    {document.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded-3xl bg-[#173c35] p-6 text-white shadow-soft">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-[#b6e37b]">Your week</p>
              <CalendarDays className="h-4 w-4 text-[#b6e37b]" />
            </div>
            <p className="display-type mt-6 text-4xl font-medium">3</p>
            <p className="mt-1 text-sm text-white/65">open actions</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[62%] rounded-full bg-[#b6e37b]" />
            </div>
            <div className="mt-3 flex justify-between text-[0.65rem] font-semibold text-white/55">
              <span>5 completed</span>
              <span>8 total</span>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-ink">Upcoming</h2>
              <Clock3 className="h-4 w-4 text-ink-faint" />
            </div>
            <div className="mt-5 grid gap-5">
              {[
                ["SEP", "04", "Information requested", "4 days"],
                ["SEP", "05", "Energy invoice", "5 days"],
                ["SEP", "24", "Insurance renewal", "24 days"],
              ].map(([month, day, label, remaining]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 shrink-0 text-center">
                    <p className="text-[0.58rem] font-extrabold tracking-wider text-attention">
                      {month}
                    </p>
                    <p className="display-type text-xl font-semibold text-ink">
                      {day}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-line pl-3">
                    <p className="truncate text-xs font-extrabold text-ink">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[0.66rem] text-ink-faint">
                      in {remaining}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-wash text-brand">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-ink">
                  Nothing else is due today.
                </h2>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  CIVORA will bring new items forward when they need you.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
