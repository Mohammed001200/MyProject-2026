import { describe, expect, it } from "vitest";
import { describeDeadline } from "./deadline";

describe("deadline calendar semantics", () => {
  it("keeps an all-day deadline open until the user's local day ends", () => {
    const due = new Date("2026-09-13T00:00:00Z");
    const now = new Date("2026-09-13T22:30:00Z");
    expect(describeDeadline(due, true, "Europe/Stockholm", now)?.label).toBe(
      "Overdue",
    );
    expect(describeDeadline(due, true, "America/Los_Angeles", now)).toEqual({
      date: "2026-09-13",
      label: "Due today",
    });
  });
  it("does not shift all-day dates into the previous day", () => {
    expect(
      describeDeadline(
        new Date("2026-09-13T00:00:00Z"),
        true,
        "America/Los_Angeles",
        new Date("2026-09-12T22:00:00Z"),
      ),
    ).toEqual({ date: "2026-09-13", label: "Due tomorrow" });
  });
  it("uses calendar days across the spring daylight-saving change", () => {
    expect(
      describeDeadline(
        new Date("2026-03-30T00:00:00Z"),
        true,
        "Europe/Stockholm",
        new Date("2026-03-29T12:00:00Z"),
      )?.label,
    ).toBe("Due tomorrow");
  });
  it("recognizes tomorrow across a year boundary", () => {
    expect(
      describeDeadline(
        new Date("2027-01-01T00:00:00Z"),
        true,
        "UTC",
        new Date("2026-12-31T23:00:00Z"),
      )?.label,
    ).toBe("Due tomorrow");
  });
  it("marks timed deadlines overdue after the exact time", () => {
    expect(
      describeDeadline(
        new Date("2026-09-13T10:00:00Z"),
        false,
        "Europe/Stockholm",
        new Date("2026-09-13T11:00:00Z"),
      ),
    ).toEqual({ date: "2026-09-13", label: "Overdue" });
  });
  it("keeps future deadlines unmarked and ignores missing dates", () => {
    const now = new Date("2026-09-13T12:00:00Z");
    expect(
      describeDeadline(new Date("2026-09-20T00:00:00Z"), true, "UTC", now)
        ?.label,
    ).toBeNull();
    expect(describeDeadline(null, true, "UTC", now)).toBeNull();
    expect(describeDeadline(new Date("invalid"), true, "UTC", now)).toBeNull();
  });
});
