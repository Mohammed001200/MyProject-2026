import { z } from "zod";

const supportedTimeZone = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid time zone");

export const onboardingSchema = z.object({
  preferredLocale: z.enum(["en", "sv"]),
  explanationStyle: z.enum(["SIMPLE", "BALANCED", "DETAILED"]),
  timezone: supportedTimeZone,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
