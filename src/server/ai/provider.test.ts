import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnalysisConfigurationError,
  getDocumentAnalysisProvider,
} from "@/server/ai/provider";

vi.mock("server-only", () => ({}));

afterEach(() => vi.unstubAllEnvs());

describe("integration analysis provider guard", () => {
  it("stays unavailable in an ordinary production environment", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CIVORA_AI_DRIVER", "integration-test");
    vi.stubEnv("CIVORA_INTEGRATION_TESTS", "true");
    vi.stubEnv("CIVORA_E2E_DATABASE", "true");
    vi.stubEnv("CI", "false");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_MODEL", "");

    expect(() => getDocumentAnalysisProvider()).toThrow(
      AnalysisConfigurationError,
    );
  });

  it("activates only for the explicit production-mode CI journey", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CIVORA_AI_DRIVER", "integration-test");
    vi.stubEnv("CIVORA_INTEGRATION_TESTS", "true");
    vi.stubEnv("CIVORA_E2E_DATABASE", "true");
    vi.stubEnv("CI", "true");

    const analysis = await getDocumentAnalysisProvider().analyze({
      bytes: new TextEncoder().encode("%PDF-1.7\nfixture"),
      mimeType: "application/pdf",
      extension: "pdf",
    });

    expect(analysis).toMatchObject({
      provider: "civora-integration-test",
      model: "deterministic-v1",
    });
  });
});
