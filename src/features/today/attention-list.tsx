"use client";

import {
  ArrowUpRight,
  Check,
  FileQuestion,
  Landmark,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { demoAttentionItems, type DemoAttentionItem } from "./demo-data";
import { prioritizeAttentionItems } from "./prioritize";

const categoryPresentation = {
  insurance: {
    icon: ShieldCheck,
    tone: "bg-attention-wash text-attention",
  },
  invoice: {
    icon: Landmark,
    tone: "bg-brand-wash text-brand",
  },
  request: {
    icon: FileQuestion,
    tone: "bg-danger-wash text-danger",
  },
} as const;

function AttentionRow({
  item,
  onComplete,
}: {
  item: DemoAttentionItem;
  onComplete: (id: string) => void;
}) {
  const presentation = categoryPresentation[item.category];
  const Icon = presentation.icon;

  return (
    <article className="group grid gap-4 px-4 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
      <span
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl",
          presentation.tone,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-xs font-bold text-ink-faint">
            {item.organization}
          </p>
          {item.priority === "urgent" && (
            <span className="rounded-full bg-danger-wash px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-danger">
              Urgent
            </span>
          )}
        </div>
        <h3 className="mt-1 text-[0.96rem] font-extrabold text-ink">
          {item.title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{item.detail}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] font-semibold">
          <span
            className={
              item.priority === "urgent" ? "text-danger" : "text-attention"
            }
          >
            {item.dueLabel}
          </span>
          <span className="text-ink-faint">Source: {item.source}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onComplete(item.id)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-xs font-bold text-ink-soft transition hover:border-brand hover:text-brand"
          aria-label={`Mark ${item.title} complete`}
        >
          <Check className="h-3.5 w-3.5" />
          Done
        </button>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-brand-strong text-white transition hover:-translate-y-0.5 hover:bg-brand"
          aria-label={`Review ${item.title}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export function AttentionList() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const openItems = prioritizeAttentionItems(
    demoAttentionItems.filter((item) => !completedIds.includes(item.id)),
  );
  const completedItems = demoAttentionItems.filter((item) =>
    completedIds.includes(item.id),
  );

  function complete(id: string) {
    setCompletedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  function reopen(id: string) {
    setCompletedIds((current) =>
      current.filter((currentId) => currentId !== id),
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        {openItems.length > 0 ? (
          <div className="divide-y divide-line">
            {openItems.map((item) => (
              <AttentionRow key={item.id} item={item} onComplete={complete} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-wash text-brand">
              <Check className="h-6 w-6" />
            </span>
            <h3 className="display-type mt-5 text-2xl font-medium text-ink">
              You&apos;re all caught up.
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">
              Everything in this preview has been handled. Quiet is a valid
              state.
            </p>
          </div>
        )}
      </div>

      {completedItems.length > 0 && (
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">
              Completed in this preview
            </h2>
            <span className="text-xs text-ink-faint">
              Stored locally in this tab
            </span>
          </div>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {completedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-wash text-brand">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-soft line-through">
                  {item.title}
                </p>
                <button
                  type="button"
                  onClick={() => reopen(item.id)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-bold text-ink-soft hover:bg-canvas-soft hover:text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reopen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
