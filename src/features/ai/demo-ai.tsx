"use client";

import { ArrowUp, Bot, FileText, Sparkles } from "lucide-react";
import { useState } from "react";

const answers = {
  "What needs my attention this week?": {
    answer:
      "Three fictional items need attention: a supporting document due September 4, an 849 SEK invoice due September 5, and an insurance renewal worth reviewing before September 24.",
    sources: [
      "Information request · page 2",
      "August energy invoice · page 1",
      "Home insurance renewal · page 1",
    ],
  },
  "Do I have any bills due soon?": {
    answer:
      "Yes. The fictional Sundby Energy invoice shows 849 SEK due on September 5, 2026. The amount and date are marked high confidence in the preview fixture.",
    sources: ["August energy invoice · page 1"],
  },
  "What changed in my insurance?": {
    answer:
      "The fictional renewal appears to increase the annual premium by 12%, with the new period starting September 24, 2026. Review the original before making a decision.",
    sources: ["Home insurance renewal · page 1"],
  },
} as const;

type Question = keyof typeof answers;

export function DemoAi() {
  const [question, setQuestion] = useState<Question>(
    "What needs my attention this week?",
  );
  const current = answers[question];

  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-line bg-surface shadow-soft lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-line bg-canvas-soft/55 p-5 lg:border-r lg:border-b-0">
        <p className="eyebrow text-ink-faint">Try a grounded question</p>
        <div className="mt-4 grid gap-2">
          {(Object.keys(answers) as Question[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuestion(item)}
              className={`rounded-xl px-3 py-3 text-left text-xs font-bold leading-5 transition ${question === item ? "bg-brand-wash text-brand" : "text-ink-soft hover:bg-surface hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="mt-6 border-t border-line pt-5 text-[0.68rem] leading-5 text-ink-faint">
          Deterministic preview responses only. No model call is made on this
          screen.
        </p>
      </aside>
      <section className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-wash text-brand">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-ink">CIVORA AI</p>
              <p className="text-[0.65rem] text-ink-faint">
                Fictional workspace context
              </p>
            </div>
          </div>
          <span className="rounded-full border border-line px-2.5 py-1 text-[0.62rem] font-bold text-ink-faint">
            Preview
          </span>
        </div>
        <div className="flex-1 space-y-7 p-5 sm:p-8">
          <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-brand-strong px-4 py-3 text-sm leading-6 text-white">
            {question}
          </div>
          <div className="max-w-[88%]">
            <div className="flex items-center gap-2 text-xs font-extrabold text-ink">
              <Sparkles className="h-4 w-4 text-brand" />
              Based on your CIVORA preview
            </div>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              {current.answer}
            </p>
            <div className="mt-5 grid gap-2">
              {current.sources.map((source) => (
                <div
                  key={source}
                  className="flex items-center gap-2 rounded-xl border border-line bg-canvas-soft/60 px-3 py-2 text-[0.68rem] font-semibold text-ink-soft"
                >
                  <FileText className="h-3.5 w-3.5 text-brand" />
                  {source}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[0.68rem] leading-5 text-ink-faint">
              This answer is a hand-authored fixture demonstrating retrieval,
              grounding, and source presentation. It is not presented as a live
              AI result.
            </p>
          </div>
        </div>
        <div className="border-t border-line p-4 sm:px-7">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-2">
            <input
              disabled
              value="Live questions unlock with the AI provider milestone"
              aria-label="Ask CIVORA"
              className="min-h-9 min-w-0 flex-1 bg-transparent text-sm text-ink-faint outline-none"
              readOnly
            />
            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-full bg-ink-faint/30 text-surface"
              aria-label="Send question unavailable in preview"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
