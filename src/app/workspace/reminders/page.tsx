import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/server/auth/session";
import { principalFromViewer } from "@/server/auth/authorization";
import { inspectAuthEnvironment } from "@/server/env";
import { readReminders } from "@/server/reminders/read";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Reminders | CIVORA",
  robots: { index: false, follow: false },
};
const messages = {
  en: {
    back: "Back to workspace",
    heading: "Reminders",
    help: "Open deadlines from your workspace, including overdue actions and the next seven days. This list updates when you open or reload it. These reminders appear only in CIVORA; no email or push notification is sent.",
    timezone: "Your time zone",
    OVERDUE: "Overdue",
    TODAY: "Due today",
    UPCOMING: "Next seven days",
    review: "Documents to review",
    empty: "No deadlines or documents need attention here.",
    open: "Open action",
    limit:
      "Showing up to 100 earliest deadlines and 20 recent documents needing review. Open Today or Documents for more.",
    today: "Open Today",
    documents: "Open documents",
  },
  sv: {
    back: "Tillbaka till arbetsytan",
    heading: "Påminnelser",
    help: "Öppna tidsfrister i din arbetsyta, både försenade åtgärder och de kommande sju dagarna. Listan uppdateras när du öppnar eller laddar om sidan. Påminnelserna visas bara i CIVORA; inget mejl eller pushmeddelande skickas.",
    timezone: "Din tidszon",
    OVERDUE: "Försenade",
    TODAY: "Senast idag",
    UPCOMING: "Kommande sju dagar",
    review: "Dokument att granska",
    empty: "Inga tidsfrister eller dokument behöver uppmärksamhet här.",
    open: "Öppna åtgärd",
    limit:
      "Visar upp till 100 tidigaste tidsfrister och 20 senaste dokument som behöver granskas. Öppna Idag eller Dokument för fler.",
    today: "Öppna Idag",
    documents: "Öppna dokument",
  },
};
export default async function RemindersPage() {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");
  const feed = await readReminders(
    principalFromViewer(viewer),
    viewer.workspaceId,
  );
  const text = messages[feed.locale];
  return (
    <main lang={feed.locale} className="min-h-dvh bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/workspace"
          className="inline-flex min-h-11 items-center font-bold text-brand"
        >
          {text.back}
        </Link>
        <h1 className="display-type mt-6 text-5xl text-ink">{text.heading}</h1>
        <p className="mt-4 leading-7 text-ink-soft">{text.help}</p>
        <p className="mt-3 text-sm text-ink-soft">
          {text.timezone}: {feed.timezone}
        </p>
        {!feed.actions.length && !feed.reviews.length && (
          <p className="mt-8 text-ink">{text.empty}</p>
        )}
        {(["OVERDUE", "TODAY", "UPCOMING"] as const).map((group) => {
          const actions = feed.actions.filter(
            (action) => action.group === group,
          );
          return actions.length > 0 ? (
            <section
              key={group}
              className="mt-10"
              aria-labelledby={`reminders-${group}`}
            >
              <h2
                id={`reminders-${group}`}
                className="text-xl font-bold text-ink"
              >
                {text[group]}
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {actions.map((action) => (
                  <li key={action.id} className="py-4">
                    <Link
                      href={
                        `/workspace/today?action=${action.id}#action-${action.id}` as Route
                      }
                      className="inline-flex min-h-11 items-center font-bold text-brand"
                    >
                      {action.title}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      <time dateTime={action.date}>{action.date}</time>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null;
        })}
        {feed.reviews.length > 0 && (
          <section className="mt-10" aria-labelledby="review-documents">
            <h2 id="review-documents" className="text-xl font-bold text-ink">
              {text.review}
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {feed.reviews.map((document) => (
                <li key={document.id}>
                  <Link
                    href={`/workspace/documents/${document.id}` as Route}
                    className="inline-flex min-h-11 items-center py-4 font-bold text-brand"
                  >
                    {document.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {feed.truncated && (
          <p role="status" className="mt-8 text-sm text-ink-soft">
            {text.limit}
          </p>
        )}
        <nav className="mt-8 flex flex-wrap gap-5">
          <Link
            href="/workspace/today"
            className="inline-flex min-h-11 items-center font-bold text-brand"
          >
            {text.today}
          </Link>
          <Link
            href="/workspace/documents"
            className="inline-flex min-h-11 items-center font-bold text-brand"
          >
            {text.documents}
          </Link>
        </nav>
      </div>
    </main>
  );
}
