export type Locale = "en" | "sv";

export function resolveLocale(value: string | null | undefined): Locale {
  return value === "sv" ? "sv" : "en";
}

const en = {
  back: "Back to workspace",
  heading: "Your preferences",
  description:
    "Choose your language, explanation style, and time zone. Language support is being added gradually. Existing documents are not rewritten.",
  form: "Preferences",
  language: "Preferred language",
  style: "Explanation style",
  simple: "Simple",
  balanced: "Balanced",
  detailed: "Detailed",
  timezone: "Time zone",
  timezoneHelp: "For example, Europe/Stockholm or UTC.",
  saving: "Saving…",
  save: "Save preferences",
  saved: "Preferences saved.",
  invalid: "Check your language, explanation style, and time zone.",
  expired: "Your session has expired. Sign in again to save your preferences.",
  failed: "Your preferences could not be saved. Please try again.",
};

export const preferenceMessages: Record<Locale, typeof en> = {
  en,
  sv: {
    back: "Tillbaka till arbetsytan",
    heading: "Dina inställningar",
    description:
      "Välj språk, förklaringsstil och tidszon. Språkstödet införs stegvis. Befintliga dokument ändras inte.",
    form: "Inställningar",
    language: "Önskat språk",
    style: "Förklaringsstil",
    simple: "Enkel",
    balanced: "Balanserad",
    detailed: "Detaljerad",
    timezone: "Tidszon",
    timezoneHelp: "Till exempel Europe/Stockholm eller UTC.",
    saving: "Sparar…",
    save: "Spara inställningar",
    saved: "Inställningarna har sparats.",
    invalid: "Kontrollera språk, förklaringsstil och tidszon.",
    expired:
      "Din session har gått ut. Logga in igen för att spara inställningarna.",
    failed: "Inställningarna kunde inte sparas. Försök igen.",
  },
};
