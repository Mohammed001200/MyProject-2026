// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const handler = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/auth", () => ({ getAuth: () => ({ handler }) }));
vi.mock("@/server/email/password-reset", () => ({
  passwordRecoveryAvailable: vi.fn(),
}));
vi.mock("@/server/env", () => ({ isConfigurationError: () => false }));
import { passwordRecoveryAvailable } from "@/server/email/password-reset";
import { POST } from "./route";
beforeEach(() => vi.resetAllMocks());
describe("recovery route configuration guard", () => {
  it("blocks all reset requests before account lookup when email is unavailable", async () => {
    vi.mocked(passwordRecoveryAvailable).mockReturnValue(false);
    const response = await POST(
      new Request("https://example.test/api/auth/request-password-reset", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  });
  it("lets the auth provider enforce token validation with private response headers", async () => {
    handler.mockResolvedValue(Response.json({ status: true }));
    const response = await POST(
      new Request("https://example.test/api/auth/reset-password", {
        method: "POST",
      }),
    );
    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
