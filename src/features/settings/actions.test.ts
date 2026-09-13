// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const database = vi.hoisted(() => ({
  profile: { update: vi.fn() },
  auditEvent: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => database }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  UnauthenticatedError: class extends Error {},
}));
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import { revalidatePath } from "next/cache";
import { savePreferences } from "./actions";
function form() {
  const data = new FormData();
  data.set("preferredLocale", "sv");
  data.set("explanationStyle", "SIMPLE");
  data.set("timezone", "Europe/Stockholm");
  return data;
}
describe("saved preferences", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireViewer).mockResolvedValue({
      session: { user: { id: "owner" } },
      workspaceId: "own-workspace",
    } as Awaited<ReturnType<typeof requireViewer>>);
    database.$transaction.mockResolvedValue([]);
  });
  it("updates only the signed-in profile and leaves onboarding unchanged", async () => {
    const input = form();
    input.set("userId", "someone-else");
    input.set("onboardingDone", "false");
    expect((await savePreferences({ status: "idle" }, input)).status).toBe(
      "success",
    );
    expect(database.profile.update).toHaveBeenCalledWith({
      where: { userId: "owner" },
      data: {
        preferredLocale: "sv",
        explanationStyle: "SIMPLE",
        timezone: "Europe/Stockholm",
      },
    });
    expect(database.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "owner",
        workspaceId: "own-workspace",
        eventType: "profile.preferences.updated",
      }),
    });
    expect(database.$transaction).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/workspace/settings");
  });
  it.each([
    ["timezone", "Not/AZone"],
    ["preferredLocale", "unsupported"],
    ["explanationStyle", "OTHER"],
  ])("rejects invalid %s", async (field, value) => {
    const input = form();
    input.set(field, value);
    expect((await savePreferences({ status: "idle" }, input)).status).toBe(
      "error",
    );
    expect(database.profile.update).not.toHaveBeenCalled();
  });
  it("requires an authenticated session", async () => {
    vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
    expect((await savePreferences({ status: "idle" }, form())).status).toBe(
      "error",
    );
    expect(database.profile.update).not.toHaveBeenCalled();
  });
  it("does not report success or revalidate after a failed transaction", async () => {
    database.$transaction.mockRejectedValue(
      new Error("private database details"),
    );
    const result = await savePreferences({ status: "idle" }, form());
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("private database details");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
