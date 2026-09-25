"use client";
import { useRef, useState } from "react";

export function ExportData() {
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
            ? "Please sign in again to download your data."
            : response.status === 413
              ? "This workspace exceeds the current export limit. No partial file was downloaded. You can still download original files from each document."
              : "Your export could not be created. Please try again.",
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
      setMessage("Your export is ready. Keep the downloaded file private.");
    } catch {
      setFailed(true);
      setMessage(
        "The download could not finish. Check your connection and try again.",
      );
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
        Download your workspace data
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Get a JSON file with your account details, preferences, personal
        workspace documents and their latest analyses, actions, and your private
        chat history. Original files can be downloaded from each document.
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-soft">
        Older analyses, operational audit records and other workspaces are not
        included. This first version supports up to 500 documents, 500 actions,
        500 chat turns and a 3 MB export.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={download}
        className="mt-4 min-h-11 rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-ink disabled:opacity-60"
      >
        {pending ? "Preparing export…" : "Download workspace data"}
      </button>
      {message && (
        <p role={failed ? "alert" : "status"} className="mt-3 text-sm text-ink">
          {message}
        </p>
      )}
    </section>
  );
}
