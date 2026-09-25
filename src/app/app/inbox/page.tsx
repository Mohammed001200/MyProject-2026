import {
  CircleCheck,
  FileText,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

const inboxItems = [
  {
    title: "Home insurance renewal",
    detail: "Understanding changes and dates",
    state: "Ready",
    icon: CircleCheck,
    tone: "text-success bg-brand-wash",
  },
  {
    title: "August energy invoice",
    detail: "Checking amount and payment deadline",
    state: "Processing",
    icon: LoaderCircle,
    tone: "text-brand bg-brand-wash",
  },
  {
    title: "Scanned letter",
    detail: "One date needs your confirmation",
    state: "Needs review",
    icon: TriangleAlert,
    tone: "text-attention bg-attention-wash",
  },
] as const;

export default function InboxPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 pb-28 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pb-16">
      <p className="eyebrow text-brand">Inbox</p>
      <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
        From arrived to understood.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        This preview demonstrates visible processing states. No background job
        is represented as production-ready yet.
      </p>
      <div className="mt-9 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        {inboxItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-4 px-5 py-5">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.tone}`}
              >
                <Icon
                  className={`h-5 w-5 ${item.state === "Processing" ? "animate-spin" : ""}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold text-ink">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs text-ink-soft">{item.detail}</p>
              </div>
              <span className="hidden text-xs font-bold text-ink-faint sm:block">
                {item.state}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-4 text-xs text-ink-soft">
        <FileText className="h-4 w-4 text-brand" />
        Processing stages will be driven by durable server state in the document
        milestone.
      </div>
    </div>
  );
}
