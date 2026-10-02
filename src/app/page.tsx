import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileSearch,
  Fingerprint,
  Languages,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { MarketingHeader } from "@/components/marketing/header";
import { ProductPreview } from "@/components/marketing/product-preview";
import { ButtonLink } from "@/components/ui/button-link";

const capabilities = [
  {
    icon: FileSearch,
    number: "01",
    title: "Understands what arrived",
    description:
      "CIVORA reads the document, identifies its purpose, and explains it in clear language without hiding the original source.",
  },
  {
    icon: Clock3,
    number: "02",
    title: "Finds what matters",
    description:
      "Deadlines, amounts, changes, and required responses are pulled forward with confidence and source evidence.",
  },
  {
    icon: BellRing,
    number: "03",
    title: "Helps you finish it",
    description:
      "Important information becomes a prioritized action, so the right thing returns at the right time.",
  },
] as const;

const process = [
  { icon: Upload, label: "Add", detail: "Upload a PDF or photo" },
  {
    icon: BookOpenCheck,
    label: "Understand",
    detail: "Get a plain explanation",
  },
  {
    icon: Sparkles,
    label: "Extract",
    detail: "See dates, amounts, and changes",
  },
  { icon: CircleCheck, label: "Act", detail: "Complete what matters" },
] as const;

const faqs = [
  {
    question: "Is CIVORA a cloud drive?",
    answer:
      "No. Documents are the evidence, not the destination. CIVORA focuses on explaining what a document means and turning it into useful next steps.",
  },
  {
    question: "Can CIVORA make decisions for me?",
    answer:
      "CIVORA can analyze, organize, and recommend. You stay in control of consequential actions, and important claims link back to their source.",
  },
  {
    question: "What documents will it support?",
    answer:
      "The first release is designed for PDFs and common image formats such as JPG and PNG. More ingestion methods will follow after the core workflow is proven.",
  },
  {
    question: "When can I use it?",
    answer:
      "CIVORA is currently in active development. The product preview shows the intended experience; private beta access will open after the security and reliability gates pass.",
  },
] as const;

function SectionIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-brand">{eyebrow}</p>
      <h2 className="display-type text-balance mt-4 text-4xl font-medium leading-[0.98] tracking-[-0.035em] text-ink sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
        {copy}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-canvas">
      <MarketingHeader />

      <section className="relative border-b border-line">
        <div className="civora-grid pointer-events-none absolute inset-0 opacity-55" />
        <div className="pointer-events-none absolute left-[9%] top-20 h-64 w-64 rounded-full bg-brand-bright/12 blur-[90px]" />
        <div className="relative mx-auto grid min-h-[780px] max-w-[1240px] items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:py-28">
          <div className="max-w-[620px]">
            <div className="animate-reveal inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft shadow-soft">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Private beta is taking shape
            </div>

            <h1 className="display-type text-balance animate-reveal delay-1 mt-7 text-[clamp(3.7rem,8vw,7.4rem)] font-medium leading-[0.82] tracking-[-0.055em] text-ink">
              Life admin,
              <span className="block italic text-brand">finally clear.</span>
            </h1>
            <p className="animate-reveal delay-2 mt-8 max-w-[570px] text-lg leading-8 text-ink-soft sm:text-xl sm:leading-9">
              CIVORA turns important documents into clear explanations, trusted
              deadlines, and the next action — so nothing quietly slips past
              you.
            </p>
            <div className="animate-reveal delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/app/today" className="min-h-13 px-6">
                Explore your day
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <a
                href="#how-it-works"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-sm font-bold text-ink no-underline transition hover:-translate-y-0.5 hover:bg-surface-raised"
              >
                See how it works
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-ink-soft">
              {[
                "Source-backed answers",
                "Private by design",
                "English + Swedish",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-brand" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section
        className="border-b border-line bg-surface py-8"
        aria-label="Product principles"
      >
        <div className="mx-auto grid max-w-[1240px] gap-6 px-5 sm:grid-cols-3 sm:px-8">
          {[
            ["01", "Explain", "Plain language, source intact"],
            ["02", "Remember", "Deadlines brought forward"],
            ["03", "Act", "A clear next step, when it matters"],
          ].map(([number, title, detail], index) => (
            <div
              key={number}
              className={`flex items-baseline gap-4 sm:px-5 ${
                index > 0 ? "sm:border-l sm:border-line" : ""
              }`}
            >
              <span className="font-mono text-[0.65rem] font-bold text-brand">
                {number}
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink">{title}</p>
                <p className="mt-1 text-xs text-ink-soft">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32"
      >
        <SectionIntro
          eyebrow="One calm workflow"
          title="From document to done."
          copy="CIVORA is designed around a single useful loop: understand what arrived, find what matters, and help you complete it."
        />

        <div className="relative mt-16 grid gap-4 md:grid-cols-4 md:gap-0">
          <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-line md:block" />
          {process.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="relative flex gap-4 border-b border-line py-5 md:block md:border-0 md:px-5 md:py-0"
              >
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-brand shadow-soft md:mx-auto">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="md:mt-6 md:text-center">
                  <p className="eyebrow text-ink-faint">Step {index + 1}</p>
                  <h3 className="mt-2 text-base font-extrabold text-ink">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-canvas-soft/60">
        <div className="mx-auto grid max-w-[1240px] lg:grid-cols-2">
          <div className="border-b border-line px-5 py-20 sm:px-8 lg:border-r lg:border-b-0 lg:py-28">
            <p className="eyebrow text-attention">The quiet problem</p>
            <blockquote className="display-type text-balance mt-5 max-w-[540px] text-4xl font-medium leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl">
              “Important” often looks exactly like one more PDF.
            </blockquote>
            <p className="mt-7 max-w-lg text-base leading-7 text-ink-soft">
              A deadline can sit on page four. A renewal can arrive months
              early. A payment change can hide in familiar wording. Storage
              alone does not tell you what changed or what to do next.
            </p>
          </div>
          <div className="px-5 py-20 sm:px-8 lg:py-28 lg:pl-16">
            <p className="eyebrow text-brand">The CIVORA difference</p>
            <div className="mt-7 divide-y divide-line">
              {[
                ["What needs attention?", "Prioritized, not buried"],
                ["Why does it matter?", "Explained from the source"],
                ["When is it due?", "Extracted with confidence"],
                ["What should I do?", "Turned into a next action"],
              ].map(([question, answer]) => (
                <div
                  key={question}
                  className="grid grid-cols-[1fr_auto] items-center gap-5 py-5"
                >
                  <span className="text-sm font-bold text-ink">{question}</span>
                  <span className="text-right text-sm text-ink-soft">
                    {answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <SectionIntro
          eyebrow="Built for useful clarity"
          title="Intelligence that earns trust."
          copy="Every part of CIVORA is shaped around evidence, calm prioritization, and user control — not AI theatre."
        />
        <div className="mt-16 border-y border-line">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <article
                key={capability.number}
                className={`group grid gap-6 py-9 sm:grid-cols-[70px_1fr_1.2fr] sm:items-start sm:gap-8 ${
                  index !== capabilities.length - 1
                    ? "border-b border-line"
                    : ""
                }`}
              >
                <span className="eyebrow text-ink-faint">
                  {capability.number}
                </span>
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-wash text-brand transition group-hover:-rotate-3 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-extrabold leading-7 text-ink">
                    {capability.title}
                  </h3>
                </div>
                <p className="text-base leading-7 text-ink-soft">
                  {capability.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Find it later",
              copy: "Search by title, organization, date, or what the document is about.",
            },
            {
              icon: Languages,
              title: "Understand it clearly",
              copy: "Keep the original separate from summaries and simple-language explanations.",
            },
            {
              icon: Fingerprint,
              title: "Only your context",
              copy: "Answers are grounded only in information your workspace is authorized to access.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-surface p-7 sm:p-8">
                <Icon className="h-5 w-5 text-brand" />
                <h3 className="mt-8 text-base font-extrabold text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">
                  {item.copy}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="security" className="px-3 py-3 sm:px-5">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] bg-[#12342d] px-5 py-20 text-[#eef6f0] sm:px-10 sm:py-28 lg:px-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(182,227,123,0.17),transparent_30%),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,52px_52px,52px_52px]" />
          <div className="relative grid gap-16 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow text-[#b6e37b]">Trust is the product</p>
              <h2 className="display-type text-balance mt-5 max-w-2xl text-5xl font-medium leading-[0.96] tracking-[-0.04em] sm:text-6xl">
                Built as if tomorrow’s document really matters.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#b9ccc5] sm:text-lg">
                Private documents demand more than a lock icon. CIVORA is being
                engineered around private storage, workspace-level
                authorization, traceable AI, and deliberate human confirmation.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                {
                  icon: LockKeyhole,
                  title: "Private by default",
                  copy: "No accidental public document URLs",
                },
                {
                  icon: ShieldCheck,
                  title: "Evidence before confidence",
                  copy: "Important claims return to their source",
                },
                {
                  icon: Fingerprint,
                  title: "Tenant isolation",
                  copy: "Access checked before data reaches AI",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 border-t border-white/12 py-5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-[#b6e37b]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#9fb7ae]">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative mt-14 max-w-3xl border-t border-white/12 pt-6 text-xs leading-5 text-[#8ea79e]">
            CIVORA is in development and has not yet completed independent
            security certification. Security claims will stay specific,
            verifiable, and proportional to what has actually shipped.
          </p>
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <SectionIntro
            eyebrow="Simple by design"
            title="Start with value. Upgrade when it compounds."
            copy="Plans are a preview while the private beta is built. Pricing and limits will be validated before billing opens."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-line bg-surface p-7">
              <p className="eyebrow text-ink-faint">Free</p>
              <p className="display-type mt-5 text-4xl font-medium text-ink">
                0 SEK
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Experience the core loop.
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-ink-soft">
                {[
                  "A small monthly document allowance",
                  "Core actions and reminders",
                  "Private document library",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="relative overflow-hidden rounded-3xl border border-brand bg-brand-strong p-7 text-white shadow-float">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-brand-bright/20 blur-3xl" />
              <div className="relative">
                <p className="eyebrow text-brand-bright">CIVORA Plus</p>
                <p className="display-type mt-5 text-4xl font-medium">
                  From 99 SEK
                </p>
                <p className="mt-2 text-sm text-white/68">
                  Proposed monthly price.
                </p>
                <ul className="mt-7 grid gap-3 text-sm text-white/78">
                  {[
                    "Higher analysis limits",
                    "Full grounded CIVORA AI",
                    "Advanced reminders and money insights",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-bright" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[0.7fr_1.3fr]">
          <SectionIntro
            eyebrow="Questions, answered"
            title="Clear from the beginning."
            copy="CIVORA should reduce uncertainty, including uncertainty about how CIVORA itself works."
          />
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-5 text-base font-extrabold text-ink">
                  {faq.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition group-open:rotate-90" />
                </summary>
                <p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-ink-soft">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1100px] text-center">
          <div className="civora-orb mx-auto h-16 w-16 rounded-[1.35rem]" />
          <h2 className="display-type text-balance mx-auto mt-8 max-w-4xl text-5xl font-medium leading-[0.94] tracking-[-0.045em] text-ink sm:text-7xl">
            Know what matters. Then move on with your day.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
            Step into the clearly marked product preview and see how CIVORA
            organizes a day.
          </p>
          <ButtonLink href="/app/today" className="mt-8 min-h-13 px-7">
            Open CIVORA preview
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
            <div>
              <Brand />
              <p className="mt-4 max-w-xs text-sm leading-6 text-ink-soft">
                The calm intelligence layer between important information and
                what you need to do.
              </p>
            </div>
            <div>
              <p className="eyebrow text-ink-faint">Product</p>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-ink-soft">
                <a href="#how-it-works" className="hover:text-ink">
                  How it works
                </a>
                <a href="#security" className="hover:text-ink">
                  Security
                </a>
                <a href="#pricing" className="hover:text-ink">
                  Pricing
                </a>
              </div>
            </div>
            <div>
              <p className="eyebrow text-ink-faint">Company</p>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-ink-soft">
                <a href="/privacy" className="hover:text-ink">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-ink">
                  Terms
                </a>
                <a href="/security" className="hover:text-ink">
                  Security
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 CIVORA. Built carefully in Sweden.</p>
            <p>Product preview · No real personal data</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
