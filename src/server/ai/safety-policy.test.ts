import { describe, expect, it } from "vitest";
import { applyAnalysisSafetyPolicy } from "@/server/ai/safety-policy";
import type { DocumentAnalysisResult } from "@/server/ai/analysis-schema";

function result(
  overrides: Partial<DocumentAnalysisResult> = {},
): DocumentAnalysisResult {
  return {
    title: "Fictional notice",
    category: "GOVERNMENT",
    organizationName: "Example Agency",
    documentDate: "2099-11-15",
    sourceDateText: "15 November 2099",
    detectedLanguage: "en",
    summary: "A fictional request.",
    simpleExplanation: "Send the requested information.",
    importance: "HIGH",
    confidence: 0.95,
    warnings: [],
    entities: [],
    actions: [
      {
        title: "Reply to the request",
        description: null,
        dueDate: "2099-12-31",
        sourceDateText: "31 December 2099",
        priority: "HIGH",
        confidence: 0.95,
        reason: "The source requests a reply.",
        pageNumber: 1,
        sourceText: "Reply no later than 31 December 2099.",
      },
    ],
    ...overrides,
  };
}

describe("analysis safety policy", () => {
  it("allows a confident, source-backed action", () => {
    const decision = applyAnalysisSafetyPolicy(result());

    expect(decision.needsReview).toBe(false);
    expect(decision.actions).toHaveLength(1);
    expect(decision.warnings).toEqual([]);
  });

  it("withholds all actions when the provider flags the analysis", () => {
    const decision = applyAnalysisSafetyPolicy(
      result({ warnings: ["The deadline is ambiguous."] }),
    );

    expect(decision.needsReview).toBe(true);
    expect(decision.actions).toEqual([]);
  });

  it("withholds an action without strong compact evidence", () => {
    const base = result();
    const decision = applyAnalysisSafetyPolicy(
      result({
        actions: [{ ...base.actions[0]!, confidence: 0.4, sourceText: null }],
      }),
    );

    expect(decision.needsReview).toBe(true);
    expect(decision.actions).toEqual([]);
  });
});
