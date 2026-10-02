"use server";
import { resolveLocale } from "@/features/localization/messages";
import { securityMessages } from "@/features/localization/security-messages";
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
  const language = form.get("locale");
  const text =
    securityMessages[
      resolveLocale(typeof language === "string" ? language : null)
    ].deletion;
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
        message: text.required,
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
        message: text.incorrect,
      };
    }
    await deleteEmptyAccount(viewer);
    return {
      status: "success",
      message: text.success,
    };
  } catch (error) {
    if (error instanceof AccountDeletionBlockedError)
      return {
        status: "error",
        message:
          error.code === "DOCUMENTS_REMAIN"
            ? text.documentsRemain
            : error.code === "SHARED_WORKSPACE"
              ? text.shared
              : text.limited,
      };
    return {
      status: "error",
      message:
        error instanceof UnauthenticatedError ? text.expired : text.unknown,
    };
  }
}
