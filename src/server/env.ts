import { z } from "zod";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const databaseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^postgres(?:ql)?:\/\//i, "must be a PostgreSQL connection URL");

const authSecretSchema = z
  .string()
  .min(32, "must contain at least 32 characters");

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "must be an HTTP or HTTPS URL");

export type AuthEnvironmentStatus =
  | { state: "ready" }
  | {
      state: "missing";
      variables: ("DATABASE_URL" | "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL")[];
    }
  | { state: "invalid"; variables: string[] };

export type AuthEnvironment = {
  databaseUrl: string;
  secret: string;
  baseUrl: string;
};

export class CivoraConfigurationError extends Error {
  readonly code = "CIVORA_CONFIGURATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "CivoraConfigurationError";
  }
}

function present(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function resolveBaseUrl(source: EnvironmentSource) {
  return (
    present(source.BETTER_AUTH_URL) ??
    present(source.NEXT_PUBLIC_APP_URL) ??
    "http://localhost:3000"
  );
}

export function inspectAuthEnvironment(
  source: EnvironmentSource = process.env,
): AuthEnvironmentStatus {
  const databaseUrl = present(source.DATABASE_URL);
  const secret = present(source.BETTER_AUTH_SECRET);
  const configuredBaseUrl =
    present(source.BETTER_AUTH_URL) ?? present(source.NEXT_PUBLIC_APP_URL);
  const missing: ("DATABASE_URL" | "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL")[] =
    [];

  if (!databaseUrl) missing.push("DATABASE_URL");
  if (!secret) missing.push("BETTER_AUTH_SECRET");
  if (source.NODE_ENV === "production" && !configuredBaseUrl) {
    missing.push("BETTER_AUTH_URL");
  }

  if (missing.length > 0) {
    return { state: "missing", variables: missing };
  }

  const invalid: string[] = [];
  if (!databaseUrlSchema.safeParse(databaseUrl).success) {
    invalid.push("DATABASE_URL");
  }
  if (!authSecretSchema.safeParse(secret).success) {
    invalid.push("BETTER_AUTH_SECRET");
  }
  if (!httpUrlSchema.safeParse(resolveBaseUrl(source)).success) {
    invalid.push("BETTER_AUTH_URL");
  }

  return invalid.length > 0
    ? { state: "invalid", variables: invalid }
    : { state: "ready" };
}

export function requireDatabaseUrl(
  source: EnvironmentSource = process.env,
): string {
  const result = databaseUrlSchema.safeParse(present(source.DATABASE_URL));

  if (!result.success) {
    throw new CivoraConfigurationError(
      "Database access is unavailable because DATABASE_URL is missing or invalid.",
    );
  }

  return result.data;
}

export function requireAuthEnvironment(
  source: EnvironmentSource = process.env,
): AuthEnvironment {
  const status = inspectAuthEnvironment(source);

  if (status.state !== "ready") {
    throw new CivoraConfigurationError(
      "Authentication is unavailable because its server configuration is incomplete.",
    );
  }

  return {
    databaseUrl: databaseUrlSchema.parse(present(source.DATABASE_URL)),
    secret: authSecretSchema.parse(present(source.BETTER_AUTH_SECRET)),
    baseUrl: httpUrlSchema.parse(resolveBaseUrl(source)),
  };
}

export function isConfigurationError(
  error: unknown,
): error is CivoraConfigurationError {
  return error instanceof CivoraConfigurationError;
}
