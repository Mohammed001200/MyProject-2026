// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  UnauthenticatedError: class extends Error {},
}));
vi.mock("@/server/auth/revoke-sessions", () => ({
  revokeOtherSessions: vi.fn(),
}));
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import { revokeOtherSessions } from "@/server/auth/revoke-sessions";
import { signOutOtherDevices } from "./session-actions";
const initial = { status: "idle" as const };
function confirmed() {
  const form = new FormData();
  form.set("confirm", "yes");
  form.set("userId", "attacker");
  return form;
}
describe("sign out other devices", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireViewer).mockResolvedValue(
      {} as Awaited<ReturnType<typeof requireViewer>>,
    );
  });
  it("requires a session", async () => {
    vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
    expect((await signOutOtherDevices(initial, confirmed())).status).toBe(
      "error",
    );
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });
  it("requires explicit confirmation", async () => {
    expect((await signOutOtherDevices(initial, new FormData())).status).toBe(
      "error",
    );
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });
  it("uses the server viewer rather than submitted identity", async () => {
    const viewer = await requireViewer();
    vi.mocked(revokeOtherSessions).mockResolvedValue(2);
    expect((await signOutOtherDevices(initial, confirmed())).status).toBe(
      "success",
    );
    expect(revokeOtherSessions).toHaveBeenCalledWith(viewer);
  });
  it("does not expose database errors", async () => {
    vi.mocked(revokeOtherSessions).mockRejectedValue(
      new Error("secret database connection"),
    );
    const result = await signOutOtherDevices(initial, confirmed());
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("secret");
  });
});
