"use client";

import { useState } from "react";

export function SettingsPreview() {
  const [language, setLanguage] = useState<"English" | "Svenska">("English");
  const [reminders, setReminders] = useState(true);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      <section className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div>
          <h2 className="text-sm font-extrabold text-ink">
            Preferred language
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            This preview preference is kept only while the page is open.
          </p>
        </div>
        <div className="flex rounded-full bg-canvas-soft p-1">
          {(["English", "Svenska"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              className={`min-h-9 rounded-full px-4 text-xs font-bold ${language === item ? "bg-surface text-ink shadow-sm" : "text-ink-faint"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div>
          <h2 className="text-sm font-extrabold text-ink">
            In-app deadline reminders
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            Production reminders will be workspace-scoped and timezone aware.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={reminders}
          onClick={() => setReminders((current) => !current)}
          className={`relative h-7 w-12 rounded-full transition ${reminders ? "bg-brand" : "bg-ink-faint/35"}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${reminders ? "left-6" : "left-1"}`}
          />
        </button>
      </section>
      <section className="p-5 sm:p-7">
        <h2 className="text-sm font-extrabold text-ink">Data controls</h2>
        <p className="mt-1 text-xs leading-5 text-ink-soft">
          Export and account deletion require authenticated, auditable server
          workflows and are intentionally not simulated.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-line px-3 py-2 text-xs font-bold text-ink-faint">
            Export · upcoming
          </span>
          <span className="rounded-full border border-line px-3 py-2 text-xs font-bold text-ink-faint">
            Delete account · upcoming
          </span>
        </div>
      </section>
    </div>
  );
}
