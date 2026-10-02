import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  Quote,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const demoDetails = {
  "demo-renewal": {
    title: "Home insurance renewal",
    organization: "Northline Insurance · fictional",
    category: "Insurance",
    summary:
      "The document appears to renew your home insurance for another year and introduces a 12% price increase.",
    explanation:
      "Your coverage continues automatically unless you change or cancel it. The main thing to review is whether the new yearly price still works for you.",
    evidence:
      "Your new annual premium will be 4,368 SEK from 24 September 2026.",
    page: 1,
    due: "September 24, 2026",
  },
  "demo-energy": {
    title: "August energy invoice",
    organization: "Sundby Energy · fictional",
    category: "Invoice",
    summary: "An invoice for 849 SEK, due September 5, 2026.",
    explanation:
      "The amount and due date are clearly stated. CIVORA would normally create a payment action and retain the source reference.",
    evidence: "Amount due: 849.00 SEK. Payment due: 2026-09-05.",
    page: 1,
    due: "September 5, 2026",
  },
  "demo-employment": {
    title: "Employment terms update",
    organization: "Aster & Co. · fictional",
    category: "Employment",
    summary: "The document appears to update remote-work terms from October.",
    explanation:
      "One paragraph is ambiguous, so the preview marks it for confirmation instead of presenting a confident conclusion.",
    evidence:
      "The revised workplace arrangement applies from October 2026, subject to team agreement.",
    page: 2,
    due: "Review suggested",
  },
  "demo-learning": {
    title: "Additional information request",
    organization: "Civic Learning Office · fictional",
    category: "Education",
    summary: "A supporting document is requested within four days.",
    explanation:
      "Your application review appears paused until the listed supporting document is submitted.",
    evidence:
      "Please provide the requested certificate no later than 4 September 2026.",
    page: 2,
    due: "September 4, 2026",
  },
  "demo-rent": {
    title: "Apartment annual notice",
    organization: "Oak House Living · fictional",
    category: "Housing",
    summary:
      "A routine annual information notice with no immediate action found.",
    explanation:
      "CIVORA would keep this searchable but avoid creating unnecessary work when no action is supported by the document.",
    evidence:
      "This notice is provided for your information. No response is required.",
    page: 1,
    due: "No action required",
  },
} as const;

type DocumentDetailPageProps = { params: Promise<{ id: string }> };

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;
  const document = demoDetails[id as keyof typeof demoDetails];
  if (!document) notFound();

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-28 pt-7 sm:px-7 lg:px-10 lg:pb-16">
      <Link
        href="/app/documents"
        className="inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-xs font-bold text-ink-soft no-underline hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to documents
      </Link>
      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-wash px-2.5 py-1 text-[0.62rem] font-extrabold text-brand">
              Ready · demo
            </span>
            <span className="text-xs font-semibold text-ink-faint">
              {document.category}
            </span>
          </div>
          <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
            {document.title}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">{document.organization}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Fictional evidence-backed preview
        </div>
      </div>

      <div className="mt-8 grid gap-7 lg:grid-cols-[0.88fr_1.12fr]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-[#dfe3dc] p-4 shadow-soft dark:bg-[#202d29]">
            <div className="aspect-[4/5] rounded-xl bg-[#fffdf7] p-8 text-[#27312d] shadow-[0_14px_40px_rgba(24,38,32,0.14)] sm:p-10">
              <div className="flex items-center justify-between border-b border-[#d9ded8] pb-5">
                <span className="text-[0.63rem] font-black tracking-[0.16em]">
                  FICTIONAL DOCUMENT
                </span>
                <FileText className="h-4 w-4 text-[#708078]" />
              </div>
              <p className="mt-9 text-[0.64rem] font-bold uppercase tracking-widest text-[#7e8983]">
                {document.organization.replace(" · fictional", "")}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight">
                {document.title}
              </h2>
              <div className="mt-8 space-y-3 text-[0.72rem] leading-6 text-[#58645e]">
                <p>
                  This visual page is a development fixture, not a real
                  person&apos;s document.
                </p>
                <p>{document.evidence}</p>
                <p>Additional fictional text is intentionally omitted.</p>
              </div>
              <div className="mt-10 border-l-2 border-[#5b8d7f] pl-4 text-[0.7rem] font-semibold leading-5 text-[#385c52]">
                Relevant evidence highlighted for review.
              </div>
              <p className="mt-12 text-center text-[0.58rem] font-bold text-[#9aa39f]">
                Page {document.page}
              </p>
            </div>
          </div>
        </section>

        <div className="grid content-start gap-5">
          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
            <p className="eyebrow text-brand">What this appears to mean</p>
            <h2 className="display-type mt-4 text-2xl font-medium text-ink">
              {document.summary}
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-soft">
              {document.explanation}
            </p>
          </section>
          <section className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
            <div className="bg-surface p-6">
              <CalendarClock className="h-5 w-5 text-attention" />
              <p className="eyebrow mt-6 text-ink-faint">Deadline / status</p>
              <p className="mt-2 text-sm font-extrabold text-ink">
                {document.due}
              </p>
            </div>
            <div className="bg-surface p-6">
              <CheckCircle2 className="h-5 w-5 text-brand" />
              <p className="eyebrow mt-6 text-ink-faint">Confidence</p>
              <p className="mt-2 text-sm font-extrabold text-ink">
                High for shown values
              </p>
            </div>
          </section>
          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-ink-faint">Source evidence</p>
              <span className="text-[0.65rem] font-bold text-brand">
                Page {document.page}
              </span>
            </div>
            <blockquote className="mt-5 flex gap-4 text-sm leading-7 text-ink-soft">
              <Quote className="mt-1 h-4 w-4 shrink-0 text-brand" />“
              {document.evidence}”
            </blockquote>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-faint">
              This is a fictional fixture. Production extraction will preserve
              page/source provenance and require server-side schema validation.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
