"use client";
import type { Locale } from "@/features/localization/messages";
import { securityMessages } from "@/features/localization/security-messages";
import { useRef, useState } from "react";

export function ExportData({ locale = "en" }: { locale?: Locale }) {
  const text = securityMessages[locale].exportData;
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function download() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/account/export", {
        cache: "no-store",
      });
      if (!response.ok) {
        setFailed(true);
        setMessage(
          response.status === 401
            ? text.expired
            : response.status === 413
              ? text.tooLarge
              : text.failed,
        );
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "civora-workspace-export.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage(text.success);
    } catch {
      setFailed(true);
      setMessage(text.network);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <section
      aria-labelledby="export-heading"
      className="mt-12 border-t border-line pt-8"
    >
      <h2 id="export-heading" className="text-xl font-bold text-ink">
        {text.heading}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{text.description}</p>
      <p className="mt-2 text-xs leading-5 text-ink-soft">{text.limits}</p>
      <button
        type="button"
        disabled={pending}
        onClick={download}
        className="mt-4 min-h-11 rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-ink disabled:opacity-60"
      >
        {pending ? text.pending : text.submit}
      </button>
      {message && (
        <p role={failed ? "alert" : "status"} className="mt-3 text-sm text-ink">
          {message}
        </p>
      )}
    </section>
  );
}
