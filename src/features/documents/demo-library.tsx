"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

const documents = [
  {
    id: "demo-renewal",
    title: "Home insurance renewal",
    organization: "Northline Insurance",
    category: "Insurance",
    date: "Aug 31, 2026",
    status: "Action found",
  },
  {
    id: "demo-energy",
    title: "August energy invoice",
    organization: "Sundby Energy",
    category: "Invoice",
    date: "Aug 30, 2026",
    status: "Ready",
  },
  {
    id: "demo-employment",
    title: "Employment terms update",
    organization: "Aster & Co.",
    category: "Employment",
    date: "Aug 28, 2026",
    status: "Review suggested",
  },
  {
    id: "demo-learning",
    title: "Additional information request",
    organization: "Civic Learning Office",
    category: "Education",
    date: "Aug 27, 2026",
    status: "Action found",
  },
  {
    id: "demo-rent",
    title: "Apartment annual notice",
    organization: "Oak House Living",
    category: "Housing",
    date: "Aug 22, 2026",
    status: "Ready",
  },
] as const;

const filters = ["All", "Action found", "Ready", "Review suggested"] as const;

export function DemoLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [document.title, document.organization, document.category].some(
          (value) => value.toLowerCase().includes(normalizedQuery),
        );
      const matchesFilter = filter === "All" || document.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search preview documents</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, organization, or category"
            className="min-h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-sm text-ink shadow-soft placeholder:text-ink-faint"
          />
        </label>
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          aria-label="Document status filter"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-ink-faint" />
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-bold transition",
                filter === item
                  ? "border-brand bg-brand-wash text-brand"
                  : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        {visibleDocuments.length > 0 ? (
          <div className="divide-y divide-line">
            {visibleDocuments.map((document) => (
              <Link
                key={document.id}
                href={`/app/documents/${document.id}` as Route}
                className="group grid gap-3 px-4 py-5 no-underline transition hover:bg-canvas-soft/70 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center sm:gap-5 sm:px-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-canvas-soft text-ink-soft">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-extrabold text-ink">
                    {document.title}
                  </h2>
                  <p className="mt-1 truncate text-xs text-ink-faint">
                    {document.organization} · {document.category}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold text-ink-soft">
                    {document.date}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-brand-wash px-2 py-0.5 text-[0.62rem] font-extrabold text-brand">
                    {document.status}
                  </span>
                </div>
                <ArrowUpRight className="hidden h-4 w-4 text-ink-faint transition group-hover:text-brand sm:block" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Search className="mx-auto h-6 w-6 text-ink-faint" />
            <h2 className="mt-4 text-base font-extrabold text-ink">
              No matching documents
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Try another word or clear the status filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
