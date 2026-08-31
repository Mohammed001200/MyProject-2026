import { describe, expect, it } from "vitest";
import {
  inspectAuthEnvironment,
  requireAuthEnvironment,
  requireDatabaseUrl,
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
