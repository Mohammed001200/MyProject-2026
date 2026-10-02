import {
  ArrowUpRight,
  Check,
  FileText,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const attentionItems = [
  {
    icon: ShieldCheck,
    eyebrow: "Insurance",
    title: "Renewal in 24 days",
    detail: "Price increased by 12%",
    due: "Review",
    tone: "bg-attention-wash text-attention",
  },
  {
    icon: Landmark,
    eyebrow: "Invoice",
    title: "849 SEK",
    detail: "Due September 5",
    due: "View",
    tone: "bg-brand-wash text-brand",
  },
  {
    icon: FileText,
    eyebrow: "Document request",
    title: "More information needed",
    detail: "Due in 4 days",
    due: "Review",
    tone: "bg-danger-wash text-danger",
  },
] as const;

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[610px] lg:mx-0">
      <div className="absolute -left-8 top-14 h-24 w-24 rounded-full bg-brand-bright/30 blur-3xl" />
      <div className="absolute -right-8 bottom-14 h-32 w-32 rounded-full bg-brand/20 blur-3xl" />
      <div className="glass relative overflow-hidden rounded-[1.7rem] p-2.5 shadow-float sm:p-3">
        <div className="overflow-hidden rounded-[1.2rem] border border-line bg-surface-raised">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ed6a5e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f4bd4f]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#61c454]" />
            </div>
            <span className="eyebrow text-ink-faint">Live product preview</span>
            <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Ready
            </div>
          </div>

          <div className="grid sm:grid-cols-[72px_1fr]">
            <aside className="hidden border-r border-line bg-canvas-soft/55 px-3 py-5 sm:block">
              <div className="mx-auto grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-xs font-black text-white">
                C
              </div>
              <div className="mt-8 grid gap-3">
                {[0, 1, 2, 3, 4].map((item) => (
                  <span
                    key={item}
                    className={`mx-auto block h-8 w-8 rounded-[10px] ${
                      item === 0 ? "bg-brand-wash" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </aside>
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-faint">
                    Wednesday, September 2
                  </p>
                  <h2 className="display-type mt-1 text-2xl font-medium tracking-[-0.02em] text-ink sm:text-[1.8rem]">
                    Good afternoon, Maya.
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    3 things need your attention.
                  </p>
                </div>
                <div className="civora-orb h-11 w-11 shrink-0 rounded-full" />
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
                {attentionItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.eyebrow}
                      className={`group flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4 ${
                        index !== attentionItems.length - 1
                          ? "border-b border-line"
                          : ""
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-faint">
                          {item.eyebrow}
                        </p>
                        <p className="truncate text-[0.78rem] font-extrabold text-ink sm:text-[0.84rem]">
                          {item.title}
                        </p>
                        <p className="truncate text-[0.68rem] text-ink-soft">
                          {item.detail}
                        </p>
                      </div>
                      <span className="hidden items-center gap-1 text-[0.68rem] font-bold text-brand sm:flex">
                        {item.due}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <div className="flex -space-x-2">
                  {["bg-[#f0cf9f]", "bg-[#bad8d0]", "bg-[#cfccc6]"].map(
                    (color) => (
                      <span
                        key={color}
                        className={`grid h-7 w-7 place-items-center rounded-full border-2 border-surface ${color}`}
                      >
                        <Check className="h-3 w-3 text-[#173c35]" />
                      </span>
                    ),
                  )}
                </div>
                <div className="flex items-center gap-2 text-[0.68rem] font-semibold text-ink-soft">
                  <Sparkles className="h-3.5 w-3.5 text-brand" />
                  12 documents understood
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-float-soft glass absolute -bottom-6 -left-3 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex lg:-left-8">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-wash text-brand">
          <Check className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[0.68rem] font-extrabold text-ink">
            Deadline found
          </p>
          <p className="text-[0.62rem] text-ink-soft">Linked to page 2</p>
        </div>
      </div>
    </div>
  );
}
