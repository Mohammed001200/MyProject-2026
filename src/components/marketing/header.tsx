"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded text-[0.82rem] font-semibold text-ink-soft no-underline transition hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/app/today"
            className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-ink-soft no-underline transition hover:bg-canvas-soft hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/app/today"
            className="inline-flex min-h-10 items-center rounded-full bg-brand-strong px-5 text-sm font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-brand"
          >
            Try the preview
          </Link>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-surface px-5 py-5 md:hidden">
          <nav
            className="mx-auto grid max-w-[1240px] gap-1"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-semibold text-ink no-underline hover:bg-canvas-soft"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/app/today"
              className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-strong px-5 text-sm font-bold text-white no-underline"
            >
              Open product preview
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
