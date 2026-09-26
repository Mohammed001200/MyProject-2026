import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const change = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-client", () => ({
  authClient: { changePassword: change },
}));
import { ChangePassword } from "./change-password";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function fill(confirm = "new-long-password") {
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "old-long-password" },
  });
  fireEvent.change(screen.getByLabelText("New password", { exact: true }), {
    target: { value: "new-long-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: confirm },
  });
}
describe("password settings", () => {
  it("rejects mismatched confirmation without a request", async () => {
    render(<ChangePassword />);
    fill("different-password");
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent("do not match");
    expect(change).not.toHaveBeenCalled();
  });
  it("revokes other sessions and clears fields after success", async () => {
    change.mockResolvedValue({ data: {}, error: null });
    render(<ChangePassword />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password changed",
    );
    expect(change).toHaveBeenCalledWith({
      currentPassword: "old-long-password",
      newPassword: "new-long-password",
      revokeOtherSessions: true,
    });
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password", { exact: true })).toHaveValue(
      "",
    );
  });
  it("blocks duplicate submissions while pending", async () => {
    let resolve!: (value: unknown) => void;
    change.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<ChangePassword />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    fireEvent.submit(screen.getByRole("form"));
    expect(change).toHaveBeenCalledTimes(1);
    resolve({ error: { status: 429 } });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts",
    );
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  });
  it("does not claim unchanged credentials after a network failure", async () => {
    change.mockRejectedValue(new Error("private detail"));
    render(<ChangePassword />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "may have changed",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("private detail");
  });
});
