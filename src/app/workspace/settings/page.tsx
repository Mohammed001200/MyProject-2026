import {
  preferenceMessages,
  resolveLocale,
} from "@/features/localization/messages";
import { DeleteAccount } from "@/features/settings/delete-account";
import { ChangePassword } from "@/features/settings/change-password";
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
  const locale = resolveLocale(profile.preferredLocale);
  const text = preferenceMessages[locale];
  return (
    <main lang={locale} className="min-h-dvh bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/workspace"
          className="inline-flex min-h-11 items-center text-sm font-bold text-brand"
        >
          {text.back}
        </Link>
        <h1 className="display-type mt-6 text-5xl text-ink">{text.heading}</h1>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          {text.description}
        </p>
        <PreferencesForm
          preferences={{
            preferredLocale: profile.preferredLocale,
            explanationStyle: profile.explanationStyle,
            timezone: profile.timezone,
          }}
        />
        <div lang="en">
          <ChangePassword />
          <SessionSecurity />
          <ExportData />
          <DeleteAccount />
        </div>
      </div>
    </main>
  );
}
