import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  children: ReactNode;
  href: Route;
  tone?: "primary" | "secondary" | "quiet";
};

export function ButtonLink({
  children,
  className,
  tone = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold no-underline transition duration-200",
        tone === "primary" &&
          "bg-brand-strong text-white shadow-[0_12px_30px_rgba(15,80,69,0.2)] hover:-translate-y-0.5 hover:bg-brand",
        tone === "secondary" &&
          "border border-line-strong bg-surface text-ink hover:-translate-y-0.5 hover:bg-surface-raised",
        tone === "quiet" && "text-ink-soft hover:bg-canvas-soft hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
