// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  passwordRecoveryAvailable,
  sendPasswordResetEmail,
  deliverPasswordReset,
} from "./password-reset";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function configure() {
  vi.stubEnv("RESEND_API_KEY", "test-key-not-real");
  vi.stubEnv("CIVORA_EMAIL_FROM", "security@example.test");
  vi.stubEnv("BETTER_AUTH_URL", "https://civora.example.test");
}
describe("password recovery mail", () => {
  it("fails closed without a key and plain sender address", () => {
    expect(passwordRecoveryAvailable({})).toBe(false);
    expect(
      passwordRecoveryAvailable({
        RESEND_API_KEY: "key",
        CIVORA_EMAIL_FROM: "not an email",
      }),
    ).toBe(false);
    expect(
      passwordRecoveryAvailable({
        RESEND_API_KEY: "key",
        CIVORA_EMAIL_FROM: "security@example.test",
      }),
    ).toBe(true);
  });
  it("sends only to the account address with a trusted-origin link and bounded request", async () => {
    configure();
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    await sendPasswordResetEmail({
      email: "owner@example.test",
      token: "private-reset-token",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["owner@example.test"]);
    expect(body.text).toContain(
      "https://civora.example.test/auth/reset-password?token=private-reset-token",
    );
    expect(options.headers["Idempotency-Key"]).not.toContain(
      "private-reset-token",
    );
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.redirect).toBe("error");
  });
  it("does not fetch when configuration is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      sendPasswordResetEmail({ email: "owner@example.test", token: "secret" }),
    ).rejects.toThrow("NOT_CONFIGURED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not expose provider details or recipient/token on failure", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private provider details", { status: 500 }),
        ),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      deliverPasswordReset({
        user: { email: "private@example.test" },
        token: "secret-token",
      }),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      "[auth] Password reset email delivery failed",
    );
  });
});
