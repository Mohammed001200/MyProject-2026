import "server-only";
import { cache } from "react";
import { getPrisma } from "@/server/db/prisma";
import { resolveLocale } from "@/features/localization/messages";

export const getUserLocale = cache(async (userId: string) => {
  const profile = await getPrisma().profile.findUnique({
    where: { userId },
    select: { preferredLocale: true },
  });
  return resolveLocale(profile?.preferredLocale);
});
