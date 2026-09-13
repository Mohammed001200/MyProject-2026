import { describe, expect, it } from "vitest";
import { demoAttentionItems } from "./demo-data";
import { prioritizeAttentionItems } from "./prioritize";

describe("prioritizeAttentionItems", () => {
  it("places urgent work before high and normal work", () => {
    const result = prioritizeAttentionItems(demoAttentionItems);
    expect(result.map((item) => item.priority)).toEqual([
      "urgent",
      "high",
      "normal",
    ]);
  });

  it("does not mutate the caller's list", () => {
    const originalOrder = demoAttentionItems.map((item) => item.id);
    prioritizeAttentionItems(demoAttentionItems);
    expect(demoAttentionItems.map((item) => item.id)).toEqual(originalOrder);
  });
});
