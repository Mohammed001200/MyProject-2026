import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/features/onboarding/schema";

describe("onboarding preferences", () => {
  it("accepts supported languages, styles, and IANA time zones", () => {
    expect(
      onboardingSchema.parse({
        preferredLocale: "sv",
        explanationStyle: "SIMPLE",
        timezone: "Europe/Stockholm",
      }),
    ).toEqual({
      preferredLocale: "sv",
      explanationStyle: "SIMPLE",
      timezone: "Europe/Stockholm",
    });
  });

  it("rejects unsupported values before persistence", () => {
    expect(
      onboardingSchema.safeParse({
        preferredLocale: "de",
        explanationStyle: "MAGICAL",
        timezone: "Sweden/Somewhere",
      }).success,
    ).toBe(false);
  });
});
