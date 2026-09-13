import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { inspectAuthEnvironment } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your private CIVORA workspace.",
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  searchParams: Promise<{ created?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const parameters = await searchParams;
  const availability = inspectAuthEnvironment().state;

  return (
    <AuthShell>
      <AuthForm
        mode="sign-in"
        availability={availability}
        accountCreated={parameters.created === "1"}
      />
    </AuthShell>
  );
}
