import { SessionSecurity } from "@/features/settings/session-security";
import { ExportData } from "@/features/settings/export-data";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PreferencesForm } from "@/features/settings/preferences-form";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  if (inspectAuthEnvironment().state !== "ready") redirect("/auth/sign-in");
  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");
  const profile = await getPrisma().profile.findUnique({
    where: { userId: viewer.session.user.id },
    select: {
      preferredLocale: true,
      explanationStyle: true,
      timezone: true,
      onboardingDone: true,
    },
  });
  if (!profile?.onboardingDone) redirect("/onboarding");
  return (
    <main className="min-h-dvh bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/workspace"
          className="inline-flex min-h-11 items-center text-sm font-bold text-brand"
        >
          Back to workspace
        </Link>
        <h1 className="display-type mt-6 text-5xl text-ink">
          Your preferences
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Update your saved language, explanation style, and time zone. Full
          language support and personalized analysis are still being developed;
          changing these preferences does not rewrite existing documents.
        </p>
        <PreferencesForm
          preferences={{
            preferredLocale: profile.preferredLocale,
            explanationStyle: profile.explanationStyle,
            timezone: profile.timezone,
          }}
        />
        <SessionSecurity />
        <ExportData />
      </div>
    </main>
  );
}
