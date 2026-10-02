"use server";

import { redirect } from "next/navigation";
import { onboardingSchema } from "@/features/onboarding/schema";
import { getViewerContext } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";

export type OnboardingActionState = {
  status: "idle" | "error";
  message?: string;
};

export async function completeOnboarding(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const input = onboardingSchema.safeParse({
    preferredLocale: formData.get("preferredLocale"),
    explanationStyle: formData.get("explanationStyle"),
    timezone: formData.get("timezone"),
  });

  if (!input.success) {
    return {
      status: "error",
      message: "Check your language, explanation style, and time zone.",
    };
  }

  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in");
  }

  const prisma = getPrisma();
  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId: viewer.session.user.id },
      update: {
        ...input.data,
        onboardingStep: 1,
        onboardingDone: true,
      },
      create: {
        userId: viewer.session.user.id,
        ...input.data,
        onboardingStep: 1,
        onboardingDone: true,
      },
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: viewer.workspaceId,
        actorUserId: viewer.session.user.id,
        eventType: "profile.onboarding.completed",
        entityType: "profile",
        metadata: {
          preferredLocale: input.data.preferredLocale,
          explanationStyle: input.data.explanationStyle,
        },
      },
    }),
  ]);

  redirect("/workspace");
}
