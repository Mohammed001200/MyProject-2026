import { describe, expect, it } from "vitest";
import { chatInputSchema, validateAnswer } from "./schema";
const sources = [
  { id: "source-1", label: "Deadline", text: "Reply by Friday", page: 1 },
];
describe("grounded chat validation", () => {
  it("rejects invented citation identifiers", () => {
    expect(() =>
      validateAnswer(
        {
          answer: "Friday",
          sourceIds: ["other-document"],
          insufficientEvidence: false,
        },
        sources,
      ),
    ).toThrow();
  });
  it("requires evidence for an answer", () => {
    expect(() =>
      validateAnswer(
        { answer: "Friday", sourceIds: [], insufficientEvidence: false },
        sources,
      ),
    ).toThrow();
  });
  it("resolves citations from server sources, deduplicating IDs", () => {
    expect(
      validateAnswer(
        {
          answer: "Friday",
          sourceIds: ["source-1", "source-1"],
          insufficientEvidence: false,
        },
        sources,
      ).citations,
    ).toEqual(sources);
  });
  it("allows an explicit lack of evidence", () => {
    expect(
      validateAnswer(
        { answer: "Unknown", sourceIds: [], insufficientEvidence: true },
        sources,
      ).insufficientEvidence,
    ).toBe(true);
  });
  it("rejects client-selected identities and oversized prompts", () => {
    const requestId = "90000000-0000-4000-8000-000000000001";
    expect(
      chatInputSchema.safeParse({
        requestId,
        question: "Hi",
        userId: "someone-else",
      }).success,
    ).toBe(false);
    expect(
      chatInputSchema.safeParse({ requestId, question: "x".repeat(2001) })
        .success,
    ).toBe(false);
  });
});
