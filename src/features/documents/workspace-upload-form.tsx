"use client";

import {
  ArrowLeft,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  Upload,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { validateDocumentCandidate } from "@/features/documents/file-policy";

export function WorkspaceUploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const file = form.get("file");

    if (!(file instanceof File)) {
      setError("Choose a document first.");
      return;
    }

    const validation = validateDocumentCandidate(file);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as {
        documentId?: string;
        message?: string;
      };

      if (!response.ok || !result.documentId) {
        setError(result.message ?? "The document could not be uploaded.");
        return;
      }

      router.push(`/workspace/documents/${result.documentId}` as Route);
    } catch {
      setError("CIVORA could not reach the upload service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/workspace"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-soft no-underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to workspace
        </Link>
        <p className="eyebrow mt-12 text-brand">Private document intake</p>
        <h1 className="display-type mt-4 text-5xl font-medium leading-none tracking-[-0.04em] text-ink sm:text-6xl">
          Add what matters.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft">
          CIVORA validates the real file bytes, stores the source outside public
          assets, and keeps every result attached to evidence.
        </p>

        <form onSubmit={submit} className="mt-10">
          <label className="group grid min-h-72 cursor-pointer place-items-center rounded-[2rem] border border-dashed border-line-strong bg-surface p-8 text-center transition hover:border-brand hover:bg-brand-wash/35">
            <input
              className="sr-only"
              type="file"
              name="file"
              accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
              required
              disabled={pending}
              onChange={(event) =>
                setFileName(event.currentTarget.files?.[0]?.name ?? null)
              }
            />
            <span>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-wash text-brand">
                {fileName ? <FileCheck2 /> : <Upload />}
              </span>
              <span className="mt-5 block text-base font-extrabold text-ink">
                {fileName ?? "Choose a PDF or image"}
              </span>
              <span className="mt-2 block text-sm text-ink-soft">
                PDF, JPG, or PNG · maximum 10 MB
              </span>
            </span>
          </label>

          {error && (
            <p
              className="mt-4 rounded-2xl bg-danger-wash px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-ink-faint">
              <LockKeyhole className="h-4 w-4" /> Authorized workspace access
              only
            </p>
            <button
              type="submit"
              disabled={pending || !fileName}
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-strong px-6 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {pending ? "Securing document…" : "Upload and analyze"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
