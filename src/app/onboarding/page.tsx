import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/auth-shell";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Personalize your workspace",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  if (inspectAuthEnvironment().state !== "ready") {
    redirect("/auth/sign-in");
  }

  const viewer = await getViewerContext();
  if (!viewer) redirect("/auth/sign-in");

  const profile = await getPrisma().profile.findUnique({
    where: { userId: viewer.session.user.id },
    select: { onboardingDone: true },
  });

  if (profile?.onboardingDone) redirect("/workspace");

  const firstName = viewer.session.user.name.trim().split(/\s+/)[0] ?? "there";

  return (
    <AuthShell>
      <OnboardingForm firstName={firstName} />
    </AuthShell>
  );
}
