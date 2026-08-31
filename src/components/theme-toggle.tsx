"use client";

import { Moon, Sun } from "lucide-react";

function preferredTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark" || explicit === "light") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = preferredTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("civora-theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-line-strong hover:text-ink"
      aria-label="Switch color theme"
    >
      <Sun className="h-[18px] w-[18px] dark:hidden" aria-hidden="true" />
      <Moon
        className="hidden h-[18px] w-[18px] dark:block"
        aria-hidden="true"
      />
    </button>
  );
}
