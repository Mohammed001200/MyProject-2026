import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const request = vi.hoisted(() => vi.fn());
const reset = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-client", () => ({
  authClient: { requestPasswordReset: request, resetPassword: reset },
}));
import { PasswordRecovery } from "./password-recovery";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe("recovery forms", () => {
  it("offers no request form when email is unconfigured", () => {
    render(<PasswordRecovery mode="request" available={false} />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("not enabled");
  });
  it("uses an account-neutral confirmation", async () => {
    request.mockResolvedValue({ error: null });
    render(<PasswordRecovery mode="request" available />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@example.test" },
    });
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account matches",
    );
    expect(request).toHaveBeenCalledWith({
      email: "owner@example.test",
      redirectTo: "/auth/reset-password",
    });
  });
  it("does not submit mismatched new passwords", async () => {
    render(<PasswordRecovery mode="reset" available token="private-token" />);
    fireEvent.change(screen.getByLabelText("New password", { exact: true }), {
      target: { value: "long-enough-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password" },
    });
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent("same password");
    expect(reset).not.toHaveBeenCalled();
  });
  it("offers a new link after invalid token rejection without exposing provider errors", async () => {
    reset.mockResolvedValue({
      error: { status: 400, message: "private provider detail" },
    });
    render(<PasswordRecovery mode="reset" available token="private-token" />);
    for (const label of ["New password", "Confirm new password"])
      fireEvent.change(screen.getByLabelText(label, { exact: true }), {
        target: { value: "long-enough-password" },
      });
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "expired or already been used",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("private provider");
  });
});
