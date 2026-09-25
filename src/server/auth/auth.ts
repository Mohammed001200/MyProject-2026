import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import {
  baseAuthOptions,
  getAuthRateLimitOptions,
} from "@/server/auth/options";
import { getPrisma } from "@/server/db/prisma";
import { requireAuthEnvironment } from "@/server/env";
import { ensurePersonalWorkspace } from "@/server/workspaces/service";

function createAuth() {
  const environment = requireAuthEnvironment();
  const prisma = getPrisma();

  return betterAuth({
    ...baseAuthOptions,
    secret: environment.secret,
    baseURL: environment.baseUrl,
    trustedOrigins: [environment.baseUrl],
    rateLimit: getAuthRateLimitOptions(),
    database: prismaAdapter(prisma, {
      provider: "postgresql",
      transaction: true,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensurePersonalWorkspace(prisma, {
              id: user.id,
              name: user.name,
            });
          },
        },
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  authInstance ??= createAuth();
  return authInstance;
}
