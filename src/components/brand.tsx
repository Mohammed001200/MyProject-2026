import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  href?: "/";
};

export function CivoraMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path
        d="M27.5 13.2A10 10 0 1 0 27.5 26.8"
        stroke="var(--canvas)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="27.7" cy="20" r="2.15" fill="var(--brand-bright)" />
    </svg>
  );
}

export function Brand({ compact = false, href = "/" }: BrandProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-md text-ink no-underline"
      aria-label="CIVORA home"
    >
      <CivoraMark className="h-8 w-8 text-brand" />
      {!compact && (
        <span className="text-[0.91rem] font-extrabold tracking-[0.18em]">
          CIVORA
        </span>
      )}
    </Link>
  );
}
