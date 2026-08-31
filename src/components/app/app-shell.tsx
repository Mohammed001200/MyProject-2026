"use client";

import {
  Bell,
  Bot,
  CheckSquare2,
  FileStack,
  Home,
  Inbox,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const navigation = [
  { label: "Today", href: "/app/today", icon: Home },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Actions", href: "/app/actions", icon: CheckSquare2 },
  { label: "Documents", href: "/app/documents", icon: FileStack },
  { label: "CIVORA AI", href: "/app/ai", icon: Bot },
] as const;

const mobileNavigation = navigation.filter((item) =>
  ["Today", "Actions", "Documents", "CIVORA AI"].includes(item.label),
);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-surface px-4 py-5 lg:flex lg:flex-col">
        <div className="px-2">
          <Brand />
        </div>

        <Link
          href="/app/upload"
          className="mt-8 flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-strong px-4 text-sm font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-brand"
        >
          <Plus className="h-4 w-4" />
          Add document
        </Link>

        <nav className="mt-7 grid gap-1" aria-label="Application navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold no-underline transition",
                  active
                    ? "bg-brand-wash text-brand-strong dark:text-brand-strong"
                    : "text-ink-soft hover:bg-canvas-soft hover:text-ink",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
                {item.label === "Inbox" && (
                  <span className="ml-auto rounded-full bg-attention-wash px-2 py-0.5 text-[0.62rem] font-extrabold text-attention">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-line bg-canvas-soft/65 p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <p className="eyebrow text-brand">Demo workspace</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink-soft">
              Fictional data only. Upload and authentication are next in the
              build.
            </p>
          </div>
          <Link
            href="/app/settings"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-soft no-underline hover:bg-canvas-soft hover:text-ink"
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </Link>
          <div className="mt-3 flex items-center gap-3 border-t border-line px-2 pt-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e2c6a1] text-xs font-extrabold text-[#3f3326]">
              M
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-ink">
                Maya Lind
              </p>
              <p className="text-[0.68rem] text-ink-faint">Preview profile</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur-xl lg:left-[248px] lg:px-7">
        <div className="lg:hidden">
          <Brand compact />
        </div>
        <button
          type="button"
          className="hidden min-h-10 w-full max-w-[360px] items-center gap-3 rounded-full border border-line bg-surface px-4 text-left text-sm text-ink-faint transition hover:border-line-strong md:flex"
          aria-label="Search CIVORA"
        >
          <Search className="h-4 w-4" />
          <span>Search documents and actions</span>
          <kbd className="ml-auto rounded-md border border-line bg-canvas-soft px-2 py-0.5 font-mono text-[0.64rem] font-bold text-ink-faint">
            Ctrl K
          </kbd>
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-line bg-surface px-3 py-1.5 text-[0.66rem] font-bold text-ink-soft sm:inline-flex">
            Preview mode
          </span>
          <ThemeToggle />
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-attention ring-2 ring-surface" />
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-16 lg:ml-[248px]">{children}</main>

      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/96 px-2 pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Mobile application navigation"
      >
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.62rem] font-bold no-underline",
                active ? "text-brand" : "text-ink-faint",
              )}
            >
              <Icon className="h-[19px] w-[19px]" />
              {item.label === "CIVORA AI" ? "AI" : item.label}
            </Link>
          );
        })}
        <Link
          href="/app/upload"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.62rem] font-bold text-brand no-underline"
        >
          <span className="grid h-8 w-8 -translate-y-2 place-items-center rounded-full bg-brand-strong text-white shadow-soft">
            <Plus className="h-4 w-4" />
          </span>
          <span className="-mt-2">Add</span>
        </Link>
      </nav>
    </div>
  );
}
