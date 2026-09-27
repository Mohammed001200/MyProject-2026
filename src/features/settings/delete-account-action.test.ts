// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const verify = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth/auth", () => ({
  getAuth: () => ({ api: { verifyPassword: verify } }),
}));
vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  UnauthenticatedError: class extends Error {},
}));
vi.mock("@/server/privacy/delete-account", () => ({
  reserveDeletionAttempt: vi.fn(),
  deleteEmptyAccount: vi.fn(),
  AccountDeletionBlockedError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import {
  deleteEmptyAccount,
  reserveDeletionAttempt,
  AccountDeletionBlockedError,
} from "@/server/privacy/delete-account";
import { deleteAccount } from "./delete-account-action";
const initial = { status: "idle" as const };
function confirmed() {
  const form = new FormData();
  form.set("password", "current-password");
  form.set("confirmation", "DELETE");
  form.set("userId", "outsider");
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireViewer).mockResolvedValue(
    {} as Awaited<ReturnType<typeof requireViewer>>,
  );
});
describe("account deletion action", () => {
  it("still requires DELETE confirmation in Swedish", async () => {
    const input = confirmed();
    input.set("locale", "sv");
    input.set("confirmation", "RADERA");
    const result = await deleteAccount(initial, input);
    expect(result.status).toBe("error");
    expect(result.message).toBe(
      "Ange ditt nuvarande lösenord och skriv DELETE för att bekräfta.",
    );
    expect(verify).not.toHaveBeenCalled();
    expect(deleteEmptyAccount).not.toHaveBeenCalled();
  });
  it("requires authentication", async () => {
    vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
    expect((await deleteAccount(initial, confirmed())).status).toBe("error");
    expect(verify).not.toHaveBeenCalled();
    expect(deleteEmptyAccount).not.toHaveBeenCalled();
  });
  it("requires explicit confirmation", async () => {
    expect((await deleteAccount(initial, new FormData())).status).toBe("error");
    expect(reserveDeletionAttempt).not.toHaveBeenCalled();
  });
  it("does not delete on invalid current password", async () => {
    verify.mockRejectedValue(new Error("private"));
    expect((await deleteAccount(initial, confirmed())).message).toContain(
      "could not be verified",
    );
    expect(deleteEmptyAccount).not.toHaveBeenCalled();
  });
  it("uses the authenticated identity only", async () => {
    const viewer = await requireViewer();
    expect((await deleteAccount(initial, confirmed())).status).toBe("success");
    expect(deleteEmptyAccount).toHaveBeenCalledWith(viewer);
    expect(reserveDeletionAttempt).toHaveBeenCalledWith(viewer);
  });
  it("explains pending file cleanup without claiming success", async () => {
    vi.mocked(deleteEmptyAccount).mockRejectedValue(
      new AccountDeletionBlockedError("DOCUMENTS_REMAIN"),
    );
    const result = await deleteAccount(initial, confirmed());
    expect(result.status).toBe("error");
    expect(result.message).toContain("cleanup");
  });
  it("rate limits before password verification", async () => {
    vi.mocked(reserveDeletionAttempt).mockRejectedValue(
      new AccountDeletionBlockedError("TOO_MANY_ATTEMPTS"),
    );
    expect((await deleteAccount(initial, confirmed())).message).toContain(
      "one hour",
    );
    expect(verify).not.toHaveBeenCalled();
  });
});
