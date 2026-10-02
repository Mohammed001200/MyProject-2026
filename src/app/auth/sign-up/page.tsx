import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your private CIVORA workspace.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  const availability = inspectAuthEnvironment().state;

  return (
    <AuthShell>
      <AuthForm mode="sign-up" availability={availability} />
    </AuthShell>
  );
}
