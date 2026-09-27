import { describeDeadline } from "@/features/today/deadline";
export function reminderDeadline(
  dueAt: Date | null,
  allDay: boolean,
  timezone: string,
  now: Date,
) {
  const deadline = describeDeadline(dueAt, allDay, timezone, now);
  const today = describeDeadline(now, false, timezone, now);
  if (!deadline || !today) return null;
  const days =
    (Date.parse(`${deadline.date}T00:00:00Z`) -
      Date.parse(`${today.date}T00:00:00Z`)) /
    86_400_000;
  if (days > 7) return null;
  return {
    date: deadline.date,
    group:
      deadline.label === "Overdue"
        ? ("OVERDUE" as const)
        : days === 0
          ? ("TODAY" as const)
          : ("UPCOMING" as const),
  };
}
