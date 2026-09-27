"use server";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth/auth";
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
import {
  AccountDeletionBlockedError,
  deleteEmptyAccount,
  reserveDeletionAttempt,
} from "@/server/privacy/delete-account";
import type { SettingsState } from "./actions";

export async function deleteAccount(
  _previous: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  try {
    const viewer = await requireViewer();
    const password = form.get("password");
    if (
      form.get("confirmation") !== "DELETE" ||
      typeof password !== "string" ||
      password.length < 1 ||
      password.length > 128
    )
      return {
        status: "error",
        message: "Enter your current password and type DELETE to confirm.",
      };
    await reserveDeletionAttempt(viewer);
    try {
      await getAuth().api.verifyPassword({
        headers: await headers(),
        body: { password },
      });
    } catch {
      return {
        status: "error",
        message:
          "Your password could not be verified. Check it or sign in again.",
      };
    }
    await deleteEmptyAccount(viewer);
    return {
      status: "success",
      message:
        "Your account and personal workspace have been deleted. You are signed out.",
    };
  } catch (error) {
    if (error instanceof AccountDeletionBlockedError)
      return {
        status: "error",
        message:
          error.code === "DOCUMENTS_REMAIN"
            ? "Delete your documents first. If file deletion is still pending, wait until cleanup finishes and try again."
            : error.code === "SHARED_WORKSPACE"
              ? "This account belongs to a shared workspace. Account deletion is not yet supported for shared workspaces."
              : "Too many attempts. Wait one hour before trying again.",
      };
    return {
      status: "error",
      message:
        error instanceof UnauthenticatedError
          ? "Your session has expired. Sign in again."
          : "Deletion could not be confirmed. Try signing in again before retrying.",
    };
  }
}
