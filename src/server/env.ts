import { z } from "zod";
import { isExplicitCiE2EEnvironment } from "@/server/testing/environment";

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

const s3BucketSchema = z
  .string()
  .trim()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/)
  .refine((value) => !value.includes(".."), "must not contain adjacent periods")
  .refine(
    (value) => !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value),
    "must not be formatted as an IP address",
  );

const s3RegionSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/i);

const strictBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

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

export type StorageEnvironmentStatus =
  | { state: "ready" }
  | { state: "missing"; variables: string[] }
  | { state: "invalid"; variables: string[] };

export type StorageEnvironment =
  | {
      driver: "local";
      root: string;
    }
  | {
      driver: "s3";
      bucket: string;
      region: string;
      endpoint?: string;
      forcePathStyle: boolean;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
      };
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

type StorageEnvironmentResult =
  | { success: true; value: StorageEnvironment }
  | {
      success: false;
      status: Exclude<StorageEnvironmentStatus, { state: "ready" }>;
    };

function parseStorageEnvironment(
  source: EnvironmentSource,
): StorageEnvironmentResult {
  const configuredDriver = present(source.CIVORA_STORAGE_DRIVER);
  const explicitCiE2E = isExplicitCiE2EEnvironment(source);

  if (source.NODE_ENV === "production" && !explicitCiE2E && !configuredDriver) {
    return {
      success: false,
      status: { state: "missing", variables: ["CIVORA_STORAGE_DRIVER"] },
    };
  }

  const driver = configuredDriver ?? "local";
  if (driver !== "local" && driver !== "s3") {
    return {
      success: false,
      status: { state: "invalid", variables: ["CIVORA_STORAGE_DRIVER"] },
    };
  }

  if (driver === "local") {
    const isLocalDevelopment =
      source.NODE_ENV === undefined || source.NODE_ENV === "development";
    if (!isLocalDevelopment && !explicitCiE2E) {
      return {
        success: false,
        status: { state: "invalid", variables: ["CIVORA_STORAGE_DRIVER"] },
      };
    }

    return {
      success: true,
      value: {
        driver,
        root: present(source.LOCAL_STORAGE_ROOT) ?? ".civora-data",
      },
    };
  }

  const bucket = present(source.S3_BUCKET);
  const region = present(source.S3_REGION);
  const missing: string[] = [];
  if (!bucket) missing.push("S3_BUCKET");
  if (!region) missing.push("S3_REGION");
  if (missing.length > 0) {
    return { success: false, status: { state: "missing", variables: missing } };
  }

  const endpoint = present(source.S3_ENDPOINT);
  const forcePathStyleValue = present(source.S3_FORCE_PATH_STYLE) ?? "false";
  const accessKeyId = present(source.S3_ACCESS_KEY_ID);
  const secretAccessKey = present(source.S3_SECRET_ACCESS_KEY);
  const sessionToken = present(source.S3_SESSION_TOKEN);
  const invalid: string[] = [];

  if (!s3BucketSchema.safeParse(bucket).success) invalid.push("S3_BUCKET");
  if (!s3RegionSchema.safeParse(region).success) invalid.push("S3_REGION");

  const endpointResult = endpoint
    ? httpUrlSchema.safeParse(endpoint)
    : undefined;
  if (endpointResult && !endpointResult.success) {
    invalid.push("S3_ENDPOINT");
  } else if (
    endpointResult?.success &&
    source.NODE_ENV === "production" &&
    new URL(endpointResult.data).protocol !== "https:"
  ) {
    invalid.push("S3_ENDPOINT");
  }

  const forcePathStyleResult =
    strictBooleanSchema.safeParse(forcePathStyleValue);
  if (!forcePathStyleResult.success) invalid.push("S3_FORCE_PATH_STYLE");

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    invalid.push("S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY");
  }
  if (sessionToken && (!accessKeyId || !secretAccessKey)) {
    invalid.push("S3_SESSION_TOKEN");
  }

  if (invalid.length > 0) {
    return {
      success: false,
      status: { state: "invalid", variables: [...new Set(invalid)] },
    };
  }

  return {
    success: true,
    value: {
      driver,
      bucket: s3BucketSchema.parse(bucket),
      region: s3RegionSchema.parse(region),
      endpoint: endpointResult?.success ? endpointResult.data : undefined,
      forcePathStyle: forcePathStyleResult.success
        ? forcePathStyleResult.data
        : false,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
              sessionToken,
            }
          : undefined,
    },
  };
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

export function inspectStorageEnvironment(
  source: EnvironmentSource = process.env,
): StorageEnvironmentStatus {
  const result = parseStorageEnvironment(source);
  return result.success ? { state: "ready" } : result.status;
}

export function requireStorageEnvironment(
  source: EnvironmentSource = process.env,
): StorageEnvironment {
  const result = parseStorageEnvironment(source);
  if (!result.success) {
    throw new CivoraConfigurationError(
      "Document storage is unavailable because its server configuration is incomplete or unsafe.",
    );
  }
  return result.value;
}

export function isConfigurationError(
  error: unknown,
): error is CivoraConfigurationError {
  return error instanceof CivoraConfigurationError;
}
