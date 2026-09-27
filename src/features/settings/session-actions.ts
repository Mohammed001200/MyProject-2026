"use server";
import { resolveLocale } from "@/features/localization/messages";
import { securityMessages } from "@/features/localization/security-messages";
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
  const language = form.get("locale");
  const text =
    securityMessages[
      resolveLocale(typeof language === "string" ? language : null)
    ].sessions;
  try {
    const viewer = await requireViewer();
    if (form.get("confirm") !== "yes")
      return {
        status: "error",
        message: text.required,
      };
    const count = await revokeOtherSessions(viewer);
    return {
      status: "success",
      message: count === 0 ? text.empty : text.success,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof UnauthenticatedError ? text.expired : text.failed,
    };
  }
}
