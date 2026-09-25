"use server";
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import { revokeOtherSessions } from "@/server/auth/revoke-sessions";
import type { SettingsState } from "./actions";

export async function signOutOtherDevices(
  _previous: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  try {
    const viewer = await requireViewer();
    if (form.get("confirm") !== "yes")
      return {
        status: "error",
        message: "Confirm that you want to sign out your other devices.",
      };
    const count = await revokeOtherSessions(viewer);
    return {
      status: "success",
      message:
        count === 0
          ? "No other sessions were active."
          : "Your other sessions have been signed out. This session is still active.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof UnauthenticatedError
          ? "Your session has expired. Please sign in again."
          : "Other sessions could not be signed out. Please try again.",
    };
  }
}
