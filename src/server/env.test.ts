import { describe, expect, it } from "vitest";
import {
  inspectAuthEnvironment,
  inspectStorageEnvironment,
  requireAuthEnvironment,
  requireDatabaseUrl,
  requireStorageEnvironment,
} from "@/server/env";

const validEnvironment = {
  DATABASE_URL: "postgresql://civora:local@127.0.0.1:5432/civora",
  BETTER_AUTH_SECRET: "a-development-only-secret-with-32-chars",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("auth environment", () => {
  it("reports every missing credential without exposing values", () => {
    expect(inspectAuthEnvironment({})).toEqual({
      state: "missing",
      variables: ["DATABASE_URL", "BETTER_AUTH_SECRET"],
    });
  });

  it("rejects invalid protocols and short secrets", () => {
    expect(
      inspectAuthEnvironment({
        DATABASE_URL: "https://database.example.com",
        BETTER_AUTH_SECRET: "too-short",
        BETTER_AUTH_URL: "ftp://civora.example.com",
      }),
    ).toEqual({
      state: "invalid",
      variables: ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"],
    });
  });

  it("accepts a complete server configuration", () => {
    expect(inspectAuthEnvironment(validEnvironment)).toEqual({
      state: "ready",
    });
    expect(requireDatabaseUrl(validEnvironment)).toBe(
      validEnvironment.DATABASE_URL,
    );
    expect(requireAuthEnvironment(validEnvironment)).toEqual({
      databaseUrl: validEnvironment.DATABASE_URL,
      secret: validEnvironment.BETTER_AUTH_SECRET,
      baseUrl: validEnvironment.BETTER_AUTH_URL,
    });
  });

  it("requires an explicit public auth URL in production", () => {
    expect(
      inspectAuthEnvironment({
        DATABASE_URL: validEnvironment.DATABASE_URL,
        BETTER_AUTH_SECRET: validEnvironment.BETTER_AUTH_SECRET,
        NODE_ENV: "production",
      }),
    ).toEqual({ state: "missing", variables: ["BETTER_AUTH_URL"] });
  });

  it("throws a safe message when authentication is unavailable", () => {
    expect(() =>
      requireAuthEnvironment({ BETTER_AUTH_SECRET: "do-not-repeat-me" }),
    ).toThrow("server configuration is incomplete");
  });
});

const explicitCiEnvironment = {
  CI: "true",
  CIVORA_E2E_DATABASE: "true",
  CIVORA_INTEGRATION_TESTS: "true",
  CIVORA_AI_DRIVER: "integration-test",
};

describe("document storage environment", () => {
  it("defaults to private local storage only in development", () => {
    expect(requireStorageEnvironment({ NODE_ENV: "development" })).toEqual({
      driver: "local",
      root: ".civora-data",
    });
    expect(inspectStorageEnvironment({ NODE_ENV: "test" })).toEqual({
      state: "invalid",
      variables: ["CIVORA_STORAGE_DRIVER"],
    });
  });

  it("permits local storage for the fully explicit CI E2E environment", () => {
    expect(
      requireStorageEnvironment({
        ...explicitCiEnvironment,
        NODE_ENV: "production",
        CIVORA_STORAGE_DRIVER: "local",
        LOCAL_STORAGE_ROOT: ".civora-data/e2e",
      }),
    ).toEqual({ driver: "local", root: ".civora-data/e2e" });
  });

  it("fails closed when production storage is not explicitly S3", () => {
    expect(inspectStorageEnvironment({ NODE_ENV: "production" })).toEqual({
      state: "missing",
      variables: ["CIVORA_STORAGE_DRIVER"],
    });
    expect(
      inspectStorageEnvironment({
        NODE_ENV: "production",
        CIVORA_STORAGE_DRIVER: "local",
      }),
    ).toEqual({
      state: "invalid",
      variables: ["CIVORA_STORAGE_DRIVER"],
    });
  });

  it("uses the AWS default credential chain when explicit keys are absent", () => {
    expect(
      requireStorageEnvironment({
        NODE_ENV: "production",
        CIVORA_STORAGE_DRIVER: "s3",
        S3_BUCKET: "civora-private-documents",
        S3_REGION: "eu-central-1",
      }),
    ).toEqual({
      driver: "s3",
      bucket: "civora-private-documents",
      region: "eu-central-1",
      endpoint: undefined,
      forcePathStyle: false,
      credentials: undefined,
    });
  });

  it("accepts complete explicit credentials and S3-compatible settings", () => {
    expect(
      requireStorageEnvironment({
        NODE_ENV: "development",
        CIVORA_STORAGE_DRIVER: "s3",
        S3_BUCKET: "civora-private-documents",
        S3_REGION: "eu-central-1",
        S3_ENDPOINT: "http://127.0.0.1:9000",
        S3_FORCE_PATH_STYLE: "true",
        S3_ACCESS_KEY_ID: "development-access",
        S3_SECRET_ACCESS_KEY: "development-secret",
        S3_SESSION_TOKEN: "development-session",
      }),
    ).toMatchObject({
      driver: "s3",
      endpoint: "http://127.0.0.1:9000",
      forcePathStyle: true,
      credentials: {
        accessKeyId: "development-access",
        secretAccessKey: "development-secret",
        sessionToken: "development-session",
      },
    });
  });

  it("rejects partial credentials and insecure production endpoints", () => {
    expect(
      inspectStorageEnvironment({
        NODE_ENV: "production",
        CIVORA_STORAGE_DRIVER: "s3",
        S3_BUCKET: "civora-private-documents",
        S3_REGION: "eu-central-1",
        S3_ENDPOINT: "http://storage.example.com",
        S3_ACCESS_KEY_ID: "must-not-be-returned",
      }),
    ).toEqual({
      state: "invalid",
      variables: ["S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"],
    });
  });
});
