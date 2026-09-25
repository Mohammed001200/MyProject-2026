import { describe, expect, it } from "vitest";
import {
  baseAuthOptions,
  getAuthRateLimitOptions,
} from "@/server/auth/options";

const explicitCiE2EEnvironment = {
  CI: "true",
  CIVORA_E2E_DATABASE: "true",
  CIVORA_INTEGRATION_TESTS: "true",
  CIVORA_AI_DRIVER: "integration-test",
};

describe("authentication rate limits", () => {
  it("keeps the standard limiter enabled without the complete CI E2E guard", () => {
    expect(baseAuthOptions.rateLimit.enabled).toBe(true);
    expect(getAuthRateLimitOptions({})).toEqual({
      enabled: true,
      window: 60,
      max: 60,
    });

    for (const key of Object.keys(explicitCiE2EEnvironment)) {
      const incompleteEnvironment = {
        ...explicitCiE2EEnvironment,
        [key]: "false",
      };

      expect(getAuthRateLimitOptions(incompleteEnvironment)).not.toHaveProperty(
        "customRules",
      );
    }
  });

  it("allows four serial browser account journeys only in explicit CI E2E", () => {
    expect(getAuthRateLimitOptions(explicitCiE2EEnvironment)).toEqual({
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-up/email": { window: 10, max: 4 },
        "/sign-in/email": { window: 10, max: 4 },
      },
    });
  });
});
