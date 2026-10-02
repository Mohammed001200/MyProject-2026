export type Deadline = {
  date: string;
  label: "Overdue" | "Due today" | "Due tomorrow" | null;
};

function dateInZone(value: Date, timeZone: string) {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  const parts = formatter.formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function describeDeadline(
  dueAt: Date | null,
  allDay: boolean,
  timeZone: string,
  now: Date,
): Deadline | null {
  if (!dueAt || !Number.isFinite(dueAt.getTime())) return null;
  // All-day deadlines are calendar dates, not instants to shift between zones.
  const date = allDay
    ? dueAt.toISOString().slice(0, 10)
    : dateInZone(dueAt, timeZone);
  const today = dateInZone(now, timeZone);
  const days =
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
    86_400_000;
  const past = allDay ? days < 0 : dueAt.getTime() < now.getTime();
  return {
    date,
    label: past
      ? "Overdue"
      : days === 0
        ? "Due today"
        : days === 1
          ? "Due tomorrow"
          : null,
  };
}
