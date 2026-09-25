import { describe, expect, it } from "vitest";
import { isExplicitCiE2EEnvironment } from "@/server/testing/environment";

const exactEnvironment = {
  CI: "true",
  CIVORA_E2E_DATABASE: "true",
  CIVORA_INTEGRATION_TESTS: "true",
  CIVORA_AI_DRIVER: "integration-test",
};

describe("CI E2E environment guard", () => {
  it("requires every independent test flag", () => {
    expect(isExplicitCiE2EEnvironment(exactEnvironment)).toBe(true);

    for (const key of Object.keys(exactEnvironment)) {
      expect(
        isExplicitCiE2EEnvironment({ ...exactEnvironment, [key]: "false" }),
      ).toBe(false);
    }
  });
});
