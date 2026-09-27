import type { Locale } from "./messages";

const en = {
  password: {
    heading: "Change password",
    description:
      "Use 12–128 characters. Changing your password signs out your other sessions and keeps this browser signed in.",
    current: "Current password",
    newPassword: "New password",
    confirm: "Confirm new password",
    pending: "Changing password…",
    length: "Use a new password between 12 and 128 characters.",
    mismatch: "The new passwords do not match.",
    different: "Choose a different password from your current one.",
    limited: "Too many attempts. Wait a moment before trying again.",
    expired: "Your session has expired. Please sign in again.",
    incorrect: "Your current password was not accepted.",
    unknown:
      "The password change could not be confirmed. Try signing in with your new password before retrying.",
    success: "Password changed. Your other sessions have been signed out.",
    network:
      "The connection was interrupted. The password may have changed; try signing in with your new password before retrying.",
  },
  sessions: {
    heading: "Account security",
    description:
      "Signed in on a shared or lost device? Sign out your other sessions. The session you are using now stays active. Anyone who knows your password can still sign in again.",
    submit: "Sign out other devices",
    confirm: "Sign out all my other sessions",
    pending: "Signing out…",
    required: "Confirm that you want to sign out your other devices.",
    empty: "No other sessions were active.",
    success:
      "Your other sessions have been signed out. This session is still active.",
    expired: "Your session has expired. Please sign in again.",
    failed: "Other sessions could not be signed out. Please try again.",
  },
  exportData: {
    heading: "Download your workspace data",
    description:
      "Get a JSON file with your account details, preferences, personal workspace documents and their latest analyses, actions, and your private chat history. Original files can be downloaded from each document.",
    limits:
      "Older analyses, operational audit records and other workspaces are not included. This first version supports up to 500 documents, 500 actions, 500 chat turns and a 3 MB export.",
    submit: "Download workspace data",
    pending: "Preparing export…",
    expired: "Please sign in again to download your data.",
    tooLarge:
      "This workspace exceeds the current export limit. No partial file was downloaded. You can still download original files from each document.",
    failed: "Your export could not be created. Please try again.",
    success: "Your export is ready. Keep the downloaded file private.",
    network:
      "The download could not finish. Check your connection and try again.",
  },
  deletion: {
    heading: "Delete account",
    home: "Return home",
    description:
      "This permanently deletes your account, preferences, personal workspace and remaining actions. Download your workspace data first if you want to keep a copy.",
    limits:
      "First delete all documents from your library and wait for any pending file deletions to finish. Accounts in shared workspaces cannot be deleted here yet. Retained infrastructure backups follow the configured retention policy.",
    documents: "Open document library",
    password: "Current password for deletion",
    confirm: "Type DELETE to confirm",
    pending: "Deleting account…",
    submit: "Delete my account permanently",
    required: "Enter your current password and type DELETE to confirm.",
    incorrect:
      "Your password could not be verified. Check it or sign in again.",
    success:
      "Your account and personal workspace have been deleted. You are signed out.",
    documentsRemain:
      "Delete your documents first. If file deletion is still pending, wait until cleanup finishes and try again.",
    shared:
      "This account belongs to a shared workspace. Account deletion is not yet supported for shared workspaces.",
    limited: "Too many attempts. Wait one hour before trying again.",
    expired: "Your session has expired. Sign in again.",
    unknown:
      "Deletion could not be confirmed. Try signing in again before retrying.",
  },
};

export const securityMessages: Record<Locale, typeof en> = {
  en,
  sv: {
    password: {
      heading: "Byt lösenord",
      description:
        "Använd 12–128 tecken. När du byter lösenord loggas dina andra sessioner ut. Den här webbläsaren förblir inloggad.",
      current: "Nuvarande lösenord",
      newPassword: "Nytt lösenord",
      confirm: "Bekräfta nytt lösenord",
      pending: "Byter lösenord…",
      length: "Använd ett nytt lösenord med 12–128 tecken.",
      mismatch: "De nya lösenorden stämmer inte överens.",
      different: "Välj ett annat lösenord än det du använder nu.",
      limited: "För många försök. Vänta en stund och försök igen.",
      expired: "Din session har gått ut. Logga in igen.",
      incorrect: "Ditt nuvarande lösenord godkändes inte.",
      unknown:
        "Lösenordsbytet kunde inte bekräftas. Prova att logga in med ditt nya lösenord innan du försöker igen.",
      success: "Lösenordet har ändrats. Dina andra sessioner har loggats ut.",
      network:
        "Anslutningen avbröts. Lösenordet kan ha ändrats. Prova att logga in med ditt nya lösenord innan du försöker igen.",
    },
    sessions: {
      heading: "Kontosäkerhet",
      description:
        "Inloggad på en delad eller borttappad enhet? Logga ut dina andra sessioner. Den här sessionen förblir aktiv. Den som känner till ditt lösenord kan fortfarande logga in igen.",
      submit: "Logga ut andra enheter",
      confirm: "Logga ut alla mina andra sessioner",
      pending: "Loggar ut…",
      required: "Bekräfta att du vill logga ut dina andra enheter.",
      empty: "Inga andra sessioner var aktiva.",
      success:
        "Dina andra sessioner har loggats ut. Den här sessionen är fortfarande aktiv.",
      expired: "Din session har gått ut. Logga in igen.",
      failed: "Andra sessioner kunde inte loggas ut. Försök igen.",
    },
    exportData: {
      heading: "Ladda ner dina uppgifter",
      description:
        "Hämta en JSON-fil med dina kontouppgifter, inställningar, dokument i din personliga arbetsyta och deras senaste analyser, åtgärder och din privata chatthistorik. Originalfiler kan laddas ner från varje dokument.",
      limits:
        "Äldre analyser, systemets granskningsloggar och andra arbetsytor ingår inte. Den här versionen stöder högst 500 dokument, 500 åtgärder, 500 chattomgångar och en export på 3 MB.",
      submit: "Ladda ner arbetsytans data",
      pending: "Förbereder export…",
      expired: "Logga in igen för att ladda ner dina uppgifter.",
      tooLarge:
        "Arbetsytan överskrider exportgränsen. Ingen ofullständig fil laddades ner. Du kan fortfarande ladda ner originalfiler från varje dokument.",
      failed: "Exporten kunde inte skapas. Försök igen.",
      success: "Din export är klar. Förvara den nedladdade filen privat.",
      network:
        "Nedladdningen kunde inte slutföras. Kontrollera anslutningen och försök igen.",
    },
    deletion: {
      heading: "Radera konto",
      home: "Till startsidan",
      description:
        "Detta raderar ditt konto, dina inställningar, din personliga arbetsyta och återstående åtgärder permanent. Ladda ner arbetsytans data först om du vill behålla en kopia.",
      limits:
        "Radera först alla dokument i biblioteket och vänta tills alla väntande filraderingar är klara. Konton i delade arbetsytor kan inte raderas här ännu. Säkerhetskopior följer den inställda lagringstiden.",
      documents: "Öppna dokumentbiblioteket",
      password: "Nuvarande lösenord för radering",
      confirm: "Skriv DELETE för att bekräfta",
      pending: "Raderar konto…",
      submit: "Radera mitt konto permanent",
      required:
        "Ange ditt nuvarande lösenord och skriv DELETE för att bekräfta.",
      incorrect:
        "Ditt lösenord kunde inte verifieras. Kontrollera det eller logga in igen.",
      success:
        "Ditt konto och din personliga arbetsyta har raderats. Du är utloggad.",
      documentsRemain:
        "Radera dina dokument först. Om filradering fortfarande pågår, vänta tills den är klar och försök igen.",
      shared:
        "Kontot tillhör en delad arbetsyta. Kontoradering stöds inte ännu för delade arbetsytor.",
      limited: "För många försök. Vänta en timme innan du försöker igen.",
      expired: "Din session har gått ut. Logga in igen.",
      unknown:
        "Raderingen kunde inte bekräftas. Prova att logga in igen innan du försöker på nytt.",
    },
  },
};
