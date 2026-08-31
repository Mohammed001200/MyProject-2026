import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireDatabaseUrl } from "@/server/env";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: requireDatabaseUrl(),
    max: process.env.NODE_ENV === "production" ? 10 : 4,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export type CivoraPrismaClient = ReturnType<typeof createPrismaClient>;

const prismaGlobal = globalThis as typeof globalThis & {
  __civoraPrisma?: CivoraPrismaClient;
};

export function getPrisma(): CivoraPrismaClient {
  prismaGlobal.__civoraPrisma ??= createPrismaClient();
  return prismaGlobal.__civoraPrisma;
}
