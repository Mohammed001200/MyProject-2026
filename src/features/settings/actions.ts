"use server";

import { revalidatePath } from "next/cache";
import { onboardingSchema } from "@/features/onboarding/schema";
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";

export type SettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function savePreferences(
  _previous: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  try {
    const viewer = await requireViewer();
    const input = onboardingSchema.safeParse({
      preferredLocale: form.get("preferredLocale"),
      explanationStyle: form.get("explanationStyle"),
      timezone: form.get("timezone"),
    });
    if (!input.success)
      return {
        status: "error",
        message: "Check your language, explanation style, and time zone.",
      };
    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.profile.update({
        where: { userId: viewer.session.user.id },
        data: input.data,
      }),
      prisma.auditEvent.create({
        data: {
          workspaceId: viewer.workspaceId,
          actorUserId: viewer.session.user.id,
          entityType: "profile",
          eventType: "profile.preferences.updated",
        },
      }),
    ]);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof UnauthenticatedError
          ? "Your session has expired. Sign in again to save your preferences."
          : "Your preferences could not be saved. Please try again.",
    };
  }
  revalidatePath("/workspace/settings");
  revalidatePath("/workspace/today");
  return { status: "success", message: "Preferences saved." };
}
