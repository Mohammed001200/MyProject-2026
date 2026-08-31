import { Plus } from "lucide-react";
import Link from "next/link";
import { DemoLibrary } from "@/features/documents/demo-library";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-28 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pb-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-brand">Document library</p>
          <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
            Find the meaning, not just the file.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Searchable fictional fixtures demonstrate the intended library
            experience.
          </p>
        </div>
        <Link
          href="/app/upload"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-brand-strong px-5 text-sm font-bold text-white no-underline hover:bg-brand"
        >
          <Plus className="h-4 w-4" />
          Add document
        </Link>
      </div>
      <div className="mt-9">
        <DemoLibrary />
      </div>
    </div>
  );
}
