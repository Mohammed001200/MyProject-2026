"use server";

import {
  preferenceMessages,
  resolveLocale,
} from "@/features/localization/messages";
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
  const submittedLocale = form.get("preferredLocale");
  const text =
    preferenceMessages[
      resolveLocale(
        typeof submittedLocale === "string" ? submittedLocale : null,
      )
    ];
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
        message: text.invalid,
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
        error instanceof UnauthenticatedError ? text.expired : text.failed,
    };
  }
  revalidatePath("/workspace");
  revalidatePath("/workspace/settings");
  revalidatePath("/workspace/today");
  return { status: "success", message: text.saved };
}
