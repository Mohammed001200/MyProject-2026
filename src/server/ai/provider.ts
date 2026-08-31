import "server-only";

import { OpenAIDocumentAnalysisProvider } from "@/server/ai/openai";
import type { DocumentAnalysisProvider } from "@/server/ai/types";

export class AnalysisConfigurationError extends Error {
  readonly code = "AI_NOT_CONFIGURED";
}

class IntegrationTestAnalysisProvider implements DocumentAnalysisProvider {
  async analyze() {
    return {
      provider: "civora-integration-test",
      model: "deterministic-v1",
      inputTokens: 0,
      outputTokens: 0,
      result: {
        title: "Fictional information request",
        category: "GOVERNMENT" as const,
        organizationName: "Example Agency",
        documentDate: "2099-11-15",
        sourceDateText: "15 November 2099",
        detectedLanguage: "en",
        summary: "A fictional agency requests additional information.",
        simpleExplanation:
          "Send the requested fictional information before the deadline.",
        importance: "HIGH" as const,
        confidence: 0.99,
        warnings: [],
        entities: [
          {
            type: "deadline",
            label: "Response deadline",
            value: "31 December 2099",
            normalizedValue: "2099-12-31",
            confidence: 0.99,
            pageNumber: 1,
            sourceText: "Respond no later than 31 December 2099.",
          },
        ],
        actions: [
          {
            title: "Submit requested information",
            description: "Review the fictional request and prepare a response.",
            dueDate: "2099-12-31",
            sourceDateText: "31 December 2099",
            priority: "HIGH" as const,
            confidence: 0.99,
            reason: "The source explicitly requests a response by this date.",
            pageNumber: 1,
            sourceText: "Respond no later than 31 December 2099.",
          },
        ],
      },
    };
  }
}

export function getDocumentAnalysisProvider(): DocumentAnalysisProvider {
  if (
    process.env.CIVORA_AI_DRIVER === "integration-test" &&
    process.env.CIVORA_INTEGRATION_TESTS === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return new IntegrationTestAnalysisProvider();
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();
  if (!apiKey || !model) {
    throw new AnalysisConfigurationError(
      "Document analysis requires OPENAI_API_KEY and OPENAI_MODEL.",
    );
  }

  return new OpenAIDocumentAnalysisProvider(apiKey, model);
}
