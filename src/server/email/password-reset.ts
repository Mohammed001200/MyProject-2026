import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";

export function passwordRecoveryAvailable(
  source: Readonly<Record<string, string | undefined>> = process.env,
) {
  return (
    Boolean(source.RESEND_API_KEY?.trim()) &&
    z.email().safeParse(source.CIVORA_EMAIL_FROM?.trim()).success
  );
}

export async function sendPasswordResetEmail(input: {
  email: string;
  token: string;
}) {
  if (!passwordRecoveryAvailable())
    throw new Error("PASSWORD_EMAIL_NOT_CONFIGURED");
  const origin = new URL(
    process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
  );
  if (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
    throw new Error("PASSWORD_EMAIL_ORIGIN_INVALID");
  // Construct the destination ourselves: no client-supplied redirect or host.
  const url = new URL("/auth/reset-password", origin.origin);
  url.searchParams.set("token", input.token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset-${createHash("sha256").update(input.token).digest("hex")}`,
    },
    body: JSON.stringify({
      from: process.env.CIVORA_EMAIL_FROM!.trim(),
      to: [input.email],
      subject: "Reset your CIVORA password",
      text: `Someone requested a password reset for your CIVORA account.\n\nChoose a new password using this link within 30 minutes:\n${url.href}\n\nIf you did not request this, ignore this email. Your password has not changed. Never share this link.`,
    }),
    signal: AbortSignal.timeout(10_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("PASSWORD_EMAIL_DELIVERY_FAILED");
}

export async function deliverPasswordReset(input: {
  user: { email: string };
  token: string;
}) {
  try {
    await sendPasswordResetEmail({
      email: input.user.email,
      token: input.token,
    });
  } catch {
    // Keep account-existence and delivery failures out of the public response.
    // Never log recipients, provider response bodies, credentials or reset links.
    console.error("[auth] Password reset email delivery failed");
  }
}
