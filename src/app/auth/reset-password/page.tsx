import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { PasswordRecovery } from "@/features/auth/password-recovery";
import { inspectAuthEnvironment } from "@/server/env";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string }>;
}) {
  const params = await searchParams;
  const token =
    typeof params.token === "string" &&
    /^[A-Za-z0-9_-]{20,128}$/.test(params.token)
      ? params.token
      : undefined;
  return (
    <AuthShell>
      <PasswordRecovery
        mode="reset"
        token={token}
        available={
          inspectAuthEnvironment().state === "ready" &&
          Boolean(token) &&
          !params.error
        }
      />
    </AuthShell>
  );
}
