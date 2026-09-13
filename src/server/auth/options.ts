import type { BetterAuthOptions } from "better-auth";
import { isExplicitCiE2EEnvironment } from "@/server/testing/environment";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const standardAuthRateLimit = {
  enabled: true,
  window: 60,
  max: 60,
} satisfies NonNullable<BetterAuthOptions["rateLimit"]>;

export function getAuthRateLimitOptions(
  source: EnvironmentSource = process.env,
): NonNullable<BetterAuthOptions["rateLimit"]> {
  if (!isExplicitCiE2EEnvironment(source)) return standardAuthRateLimit;

  return {
    ...standardAuthRateLimit,
    customRules: {
      // The two serial browser projects each provision and authenticate an
      // owner and outsider. Better Auth otherwise caps each route at three.
      "/sign-up/email": { window: 10, max: 4 },
      "/sign-in/email": { window: 10, max: 4 },
    },
  };
}

export const baseAuthOptions = {
  appName: "CIVORA",
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  advanced: {
    cookiePrefix: "civora",
    database: {
      generateId: "uuid",
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  rateLimit: standardAuthRateLimit,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
} satisfies BetterAuthOptions;
