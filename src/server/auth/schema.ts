import { betterAuth } from "better-auth";
import { baseAuthOptions } from "./options";

// Schema-generation entrypoint. Runtime auth adds the database adapter and hooks
// in `auth.ts`; keeping this module database-free lets the official CLI generate
// the required Prisma models without a live PostgreSQL connection.
export const auth = betterAuth(baseAuthOptions);
