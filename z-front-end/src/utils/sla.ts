export interface PausedTimeRange {
  pausedTime: string | Date;
  resumeTime: string | Date | null; 
}

export interface CalculateOfficeEndTimeParams {
  from: Date;
  hoursToWork: number;
  timezone?: string;
  workStart?: string;   // "HH:mm:ss"
  workEnd?: string;
  lunchStart?: string;
  lunchEnd?: string;
  pausedTime?: PausedTimeRange[];
  weekendDays?: number[]; // 0=Sun, 6=Sat
}

function parseTime(timeStr: string) {
  const [hour, minute, second] = timeStr.split(":").map(Number);
  return { hour, minute: minute ?? 0, second: second ?? 0 };
}

function timeToSeconds(timeStr: string): number {
  const { hour, minute, second } = parseTime(timeStr);
  return hour * 3600 + minute * 60 + second;
}

function makeDateInTimezone(year: number, month: number, day: number, timeStr: string, timezone: string): Date {
  const { hour, minute, second } = parseTime(timeStr);
  const isoLocal = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  const tempDate = new Date(`${isoLocal}Z`);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = formatter.formatToParts(tempDate).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = parseInt(p.value);
    return acc;
  }, {} as Record<string, number>);
  const utcMs = Date.UTC(
    tempDate.getUTCFullYear(), tempDate.getUTCMonth(), tempDate.getUTCDate(),
    tempDate.getUTCHours(), tempDate.getUTCMinutes(), tempDate.getUTCSeconds()
  );
  const localMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - (localMs - utcMs));
}

function getDatePartsInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  });
  const parts = formatter.formatToParts(date).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {} as Record<string, string>);
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: parseInt(parts.year), month: parseInt(parts.month),
    day: parseInt(parts.day), dayOfWeek: weekdayMap[parts.weekday],
  };
}

function normalizePausedTime(pausedTime: PausedTimeRange[]): [Date, Date][] {
  return pausedTime
    .map(({ pausedTime, resumeTime }) => {
      const start = pausedTime instanceof Date ? pausedTime : new Date(pausedTime);
      const end   = resumeTime == null
        ? new Date()                                          // null → now
        : resumeTime instanceof Date ? resumeTime : new Date(resumeTime);

      if (isNaN(start.getTime())) throw new Error(`Invalid pausedTime: ${pausedTime}`);
      if (isNaN(end.getTime()))   throw new Error(`Invalid resumeTime: ${resumeTime}`);
      if (start >= end)           throw new Error(`pausedTime must be before resumeTime`);
      return [start, end] as [Date, Date];
    })
    .sort((a, b) => a[0].getTime() - b[0].getTime());
}

/**
 * Walk through a shift [shiftStart, shiftEnd], skipping paused blocks,
 * consuming up to secondsNeeded of real working time.
 */
function advanceThroughShift(
  shiftStart: Date,
  shiftEnd: Date,
  secondsNeeded: number,
  outOfOffice: [Date, Date][]
): { endTime: Date | null; secondsConsumed: number } {
  const oooInShift = outOfOffice
    .map(([s, e]) => [
      new Date(Math.max(s.getTime(), shiftStart.getTime())),
      new Date(Math.min(e.getTime(), shiftEnd.getTime())),
    ] as [Date, Date])
    .filter(([s, e]) => s < e);

  let cursor = shiftStart;
  let secondsConsumed = 0;

  for (const [oooStart, oooEnd] of oooInShift) {
    if (cursor >= shiftEnd) break;
    const segEnd = new Date(Math.min(oooStart.getTime(), shiftEnd.getTime()));
    if (cursor < segEnd) {
      const segSeconds = Math.floor((segEnd.getTime() - cursor.getTime()) / 1000);
      if (secondsConsumed + segSeconds >= secondsNeeded) {
        return {
          endTime: new Date(cursor.getTime() + (secondsNeeded - secondsConsumed) * 1000),
          secondsConsumed: secondsNeeded,
        };
      }
      secondsConsumed += segSeconds;
    }
    cursor = new Date(Math.max(cursor.getTime(), oooEnd.getTime()));
  }

  if (cursor < shiftEnd) {
    const segSeconds = Math.floor((shiftEnd.getTime() - cursor.getTime()) / 1000);
    if (secondsConsumed + segSeconds >= secondsNeeded) {
      return {
        endTime: new Date(cursor.getTime() + (secondsNeeded - secondsConsumed) * 1000),
        secondsConsumed: secondsNeeded,
      };
    }
    secondsConsumed += segSeconds;
  }

  return { endTime: null, secondsConsumed };
}

export function calculateOfficeEndTime({
  from,
  hoursToWork,
  timezone    = Intl.DateTimeFormat().resolvedOptions().timeZone,
  workStart   = "09:00:00",
  workEnd     = "18:00:00",
  lunchStart  = "12:00:00",
  lunchEnd    = "13:00:00",
  pausedTime  = [],
  weekendDays = [0, 6],
}: CalculateOfficeEndTimeParams): Date {
  if (!from || !hoursToWork || hoursToWork <= 0)
    throw new Error("Invalid input: from and hoursToWork must be valid and positive");
  if (timeToSeconds(workStart) >= timeToSeconds(workEnd))
    throw new Error("workStart must be before workEnd");
  if (timeToSeconds(lunchStart) >= timeToSeconds(lunchEnd))
    throw new Error("lunchStart must be before lunchEnd");
  if (timeToSeconds(lunchStart) < timeToSeconds(workStart) || timeToSeconds(lunchEnd) > timeToSeconds(workEnd))
    throw new Error("Lunch time must be within work hours");

  const sortedOoo = normalizePausedTime(pausedTime);
  let remainingSeconds = Math.floor(hoursToWork * 3600);
  let { year, month, day } = getDatePartsInTimezone(from, timezone);
  const MAX_ITERATIONS = 365;
  let iter = 0;

  while (remainingSeconds > 0 && iter < MAX_ITERATIONS) {
    iter++;
    const midday = makeDateInTimezone(year, month, day, "12:00:00", timezone);
    const { dayOfWeek } = getDatePartsInTimezone(midday, timezone);

    if (!weekendDays.includes(dayOfWeek)) {
      const workDayStart = makeDateInTimezone(year, month, day, workStart, timezone);
      const workDayEnd   = makeDateInTimezone(year, month, day, workEnd, timezone);
      const lunchStartTs = makeDateInTimezone(year, month, day, lunchStart, timezone);
      const lunchEndTs   = makeDateInTimezone(year, month, day, lunchEnd, timezone);

      // MORNING SHIFT
      const morningStart = new Date(Math.max(from.getTime(), workDayStart.getTime()));
      if (morningStart < lunchStartTs) {
        const { endTime, secondsConsumed } = advanceThroughShift(morningStart, lunchStartTs, remainingSeconds, sortedOoo);
        if (endTime) return endTime;
        remainingSeconds -= secondsConsumed;
      }

      // AFTERNOON SHIFT
      if (remainingSeconds > 0) {
        const afternoonStart = new Date(Math.max(from.getTime(), lunchEndTs.getTime()));
        if (afternoonStart < workDayEnd) {
          const { endTime, secondsConsumed } = advanceThroughShift(afternoonStart, workDayEnd, remainingSeconds, sortedOoo);
          if (endTime) return endTime;
          remainingSeconds -= secondsConsumed;
        }
      }
    }

    const next = new Date(midday.getTime() + 24 * 60 * 60 * 1000);
    ({ year, month, day } = getDatePartsInTimezone(next, timezone));
  }

  if (iter >= MAX_ITERATIONS) throw new Error(`Could not calculate within ${MAX_ITERATIONS} days`);
  throw new Error("Unexpected error");
}