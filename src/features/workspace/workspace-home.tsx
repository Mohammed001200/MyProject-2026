import { resolveLocale } from "@/features/localization/messages";
import {
  ArrowRight,
  Check,
  Database,
  Fingerprint,
  FolderOpen,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import type { Route } from "next";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { SignOutButton } from "@/features/workspace/sign-out-button";

const messages = {
  en: {
    session: "Server-validated session",
    sessionDetail: "Your identity is resolved on the server.",
    personal: "Personal workspace",
    personalDetail:
      "Membership keeps every document inside your workspace boundary.",
    preferences: "Preferences saved",
    preferencesDetail: "Language, time zone, and explanation style persist.",
    active: "Identity foundation active",
    ready: "Your space is ready,",
    documents: "Open documents",
    upload: "Add a document",
    today: "Open Today",
    ask: "Ask CIVORA",
    settings: "Settings",
    evidence: "Source-backed by design",
    intro:
      " has a private document flow. Upload a source, understand what matters, and follow every action back to its evidence.",
    footer:
      "CIVORA validates uploaded file bytes, restricts access to your authorized workspace, and keeps document evidence connected to every generated action.",
  },
  sv: {
    session: "Verifierad inloggning",
    sessionDetail: "Din inloggning kontrolleras av servern.",
    personal: "Personlig arbetsyta",
    personalDetail: "Dina dokument hör till din privata arbetsyta.",
    preferences: "Sparade inställningar",
    preferencesDetail: "Språk, tidszon och förklaringsstil sparas.",
    active: "Du är inloggad",
    ready: "Din arbetsyta är redo,",
    documents: "Öppna dokument",
    upload: "Lägg till dokument",
    today: "Öppna Idag",
    ask: "Fråga CIVORA",
    settings: "Inställningar",
    evidence: "Med stöd i dina källor",
    intro:
      " har ett privat dokumentflöde. Ladda upp en källa, förstå det viktiga och följ varje åtgärd tillbaka till underlaget.",
    footer:
      "CIVORA kontrollerar uppladdade filer, begränsar åtkomsten till din arbetsyta och kopplar skapade åtgärder till dokumentens underlag.",
  },
};

type WorkspaceHomeProps = {
  locale?: string;
  firstName: string;
  workspaceName: string;
};

export function WorkspaceHome({
  firstName,
  workspaceName,
  locale = "en",
}: WorkspaceHomeProps) {
  const language = resolveLocale(locale);
  const text = messages[language];
  const foundations = [
    {
      icon: Fingerprint,
      title: text.session,
      detail: text.sessionDetail,
    },
    {
      icon: Database,
      title: text.personal,
      detail: text.personalDetail,
    },
    {
      icon: SlidersHorizontal,
      title: text.preferences,
      detail: text.preferencesDetail,
    },
  ] as const;

  return (
    <main lang={language} className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-canvas/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle
              label={language === "sv" ? "Byt färgtema" : "Switch color theme"}
            />
            <SignOutButton locale={language} />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-line">
        <div className="civora-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-wash px-3 py-2 text-xs font-extrabold text-brand">
              <Check className="h-3.5 w-3.5" />
              {text.active}
            </div>
            <h1 className="display-type text-balance mt-7 text-6xl font-medium leading-[0.9] tracking-[-0.05em] text-ink sm:text-7xl">
              {text.ready}
              <span className="block italic text-brand">{firstName}.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
              <strong className="text-ink">{workspaceName}</strong>
              {text.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink
                href={"/workspace/documents" as Route}
                className="min-h-13 px-6"
              >
                {text.documents} <FolderOpen className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/workspace/upload"
                tone="secondary"
                className="min-h-13 px-6"
              >
                {text.upload} <Upload className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/workspace/today"
                tone="quiet"
                className="min-h-13 px-6"
              >
                {text.today} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={"/workspace/ai" as Route} tone="quiet">
                {text.ask}
              </ButtonLink>
              <ButtonLink href={"/workspace/reminders" as Route} tone="quiet">
                {language === "sv" ? "Påminnelser" : "Reminders"}
              </ButtonLink>
              <ButtonLink href={"/workspace/settings" as Route} tone="quiet">
                {text.settings}
              </ButtonLink>
            </div>
          </div>

          <div className="border-y border-line bg-surface/65 px-5 py-2 sm:px-6">
            {foundations.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="grid grid-cols-[44px_1fr] gap-4 border-b border-line py-5 last:border-0"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-wash text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-ink">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        <p className="eyebrow text-ink-faint">{text.evidence}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          {text.footer}
        </p>
      </section>
    </main>
  );
}
