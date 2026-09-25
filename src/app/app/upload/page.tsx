import { UploadPreview } from "@/features/documents/upload-preview";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-[820px] px-4 pb-28 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pb-16">
      <p className="eyebrow text-brand">Add document</p>
      <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
        Turn a file into something useful.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
        Start with the document. CIVORA will make its status and every
        processing step visible.
      </p>
      <div className="mt-9">
        <UploadPreview />
      </div>
    </div>
  );
}
