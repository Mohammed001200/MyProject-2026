import { describe, expect, it } from "vitest";
import { reminderDeadline } from "./deadlines";
describe("in-app reminder window", () => {
  const now = new Date("2026-09-27T22:30:00Z");
  it("uses the saved timezone for today's all-day reminders", () => {
    expect(
      reminderDeadline(
        new Date("2026-09-28T00:00:00Z"),
        true,
        "Europe/Stockholm",
        now,
      )?.group,
    ).toBe("TODAY");
    expect(
      reminderDeadline(
        new Date("2026-09-28T00:00:00Z"),
        true,
        "America/Los_Angeles",
        now,
      )?.group,
    ).toBe("UPCOMING");
  });
  it("includes overdue and exactly seven calendar days, excluding later dates", () => {
    expect(
      reminderDeadline(
        new Date("2026-09-20T00:00:00Z"),
        true,
        "Europe/Stockholm",
        now,
      )?.group,
    ).toBe("OVERDUE");
    expect(
      reminderDeadline(
        new Date("2026-10-05T00:00:00Z"),
        true,
        "Europe/Stockholm",
        now,
      )?.group,
    ).toBe("UPCOMING");
    expect(
      reminderDeadline(
        new Date("2026-10-06T00:00:00Z"),
        true,
        "Europe/Stockholm",
        now,
      ),
    ).toBeNull();
    expect(reminderDeadline(null, true, "UTC", now)).toBeNull();
  });
  it("handles DST and elapsed timed deadlines on the same local day", () => {
    expect(
      reminderDeadline(
        new Date("2026-03-30T00:00:00Z"),
        true,
        "Europe/Stockholm",
        new Date("2026-03-23T12:00:00Z"),
      )?.group,
    ).toBe("UPCOMING");
    expect(
      reminderDeadline(
        new Date("2026-09-28T00:05:00Z"),
        false,
        "Europe/Stockholm",
        new Date("2026-09-28T00:10:00Z"),
      )?.group,
    ).toBe("OVERDUE");
  });
});
