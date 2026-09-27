import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { PasswordRecovery } from "@/features/auth/password-recovery";
import { inspectAuthEnvironment } from "@/server/env";
import { passwordRecoveryAvailable } from "@/server/email/password-reset";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <PasswordRecovery
        mode="request"
        available={
          inspectAuthEnvironment().state === "ready" &&
          passwordRecoveryAvailable()
        }
      />
    </AuthShell>
  );
}
