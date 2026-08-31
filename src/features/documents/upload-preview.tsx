"use client";

import {
  Check,
  FileText,
  LockKeyhole,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { validateDocumentCandidate } from "./file-policy";

const stages = [
  "Validating locally",
  "Preparing secure metadata",
  "Previewing processing UX",
  "Preview ready",
];

export function UploadPreview() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile || stage >= stages.length - 1) return;
    const timeout = window.setTimeout(
      () => setStage((current) => current + 1),
      720,
    );
    return () => window.clearTimeout(timeout);
  }, [selectedFile, stage]);

  function choose(file: File | undefined) {
    if (!file) return;
    const result = validateDocumentCandidate(file);
    if (!result.ok) {
      setSelectedFile(null);
      setError(result.message);
      return;
    }
    setError(null);
    setStage(0);
    setSelectedFile(file);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    choose(event.dataTransfer.files[0]);
  }

  function reset() {
    setSelectedFile(null);
    setError(null);
    setStage(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  const complete = selectedFile !== null && stage === stages.length - 1;

  return (
    <div>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-attention/25 bg-attention-wash px-4 py-3.5 text-xs leading-5 text-attention">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Interface preview:</strong> the selected file stays in your
          browser and is never uploaded. Persistent private storage is enabled
          only after authentication and authorization are wired.
        </p>
      </div>

      {!selectedFile ? (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={drop}
          className="rounded-[2rem] border border-dashed border-line-strong bg-surface px-5 py-16 text-center shadow-soft transition hover:border-brand sm:py-20"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-wash text-brand">
            <UploadCloud className="h-7 w-7" />
          </span>
          <h2 className="display-type mt-6 text-2xl font-medium text-ink">
            Drop an important document here.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
            PDF, JPG, JPEG, or PNG · maximum 10 MB in this preview
          </p>
          <label className="mt-7 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-brand-strong px-5 text-sm font-bold text-white transition hover:bg-brand">
            Choose a file
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="sr-only"
              onChange={(event) => choose(event.target.files?.[0])}
            />
          </label>
          {error && (
            <p
              role="alert"
              className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-danger-wash px-3 py-2 text-xs font-bold text-danger"
            >
              <X className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-soft">
          <div className="flex items-center gap-4 border-b border-line px-5 py-5 sm:px-7">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-canvas-soft text-brand">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-ink">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · local only
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft hover:text-ink"
              aria-label="Choose another file"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 sm:p-7" aria-live="polite">
            <div className="h-1.5 overflow-hidden rounded-full bg-canvas-soft">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
              />
            </div>
            <div className="mt-7 grid gap-4">
              {stages.map((label, index) => {
                const done = index < stage || complete;
                const current = index === stage && !complete;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 text-sm ${index > stage && !complete ? "text-ink-faint" : "text-ink"}`}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full border ${done ? "border-brand bg-brand text-white" : current ? "border-brand bg-brand-wash text-brand" : "border-line bg-canvas-soft text-ink-faint"}`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span
                          className={
                            current
                              ? "h-2 w-2 animate-pulse rounded-full bg-brand"
                              : "h-1.5 w-1.5 rounded-full bg-ink-faint"
                          }
                        />
                      )}
                    </span>
                    <span
                      className={
                        current || done ? "font-bold" : "font-semibold"
                      }
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            {complete && (
              <div className="mt-7 rounded-2xl bg-brand-wash p-4 text-sm leading-6 text-brand">
                <strong>Preview complete.</strong> No document content was read
                or sent anywhere. This state model will connect to the durable
                upload pipeline next.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
