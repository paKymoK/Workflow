interface CalculateOfficeEndTimeParams {
    from: Date;
    hoursToWork: number;
    timezone?: string;
    workStart?: string; // "HH:mm:ss"
    workEnd?: string;
    lunchStart?: string;
    lunchEnd?: string;
    outOfOffice?: [Date, Date][];
    weekendDays?: number[]; // 0 = Sunday, 6 = Saturday
}

function parseTime(timeStr: string): { hour: number; minute: number; second: number } {
    const [hour, minute, second] = timeStr.split(":").map(Number);
    return { hour, minute: minute ?? 0, second: second ?? 0 };
}

function timeToSeconds(timeStr: string): number {
    const { hour, minute, second } = parseTime(timeStr);
    return hour * 3600 + minute * 60 + second;
}

/**
 * Build a Date for a given calendar date + time string in a specific timezone.
 * Uses Intl to find the UTC offset for that timezone on that date.
 */
function makeDateInTimezone(year: number, month: number, day: number, timeStr: string, timezone: string): Date {
    const { hour, minute, second } = parseTime(timeStr);
    // Create an ISO string and parse it with the timezone offset resolved via Intl
    const isoLocal = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

    // Use Intl to determine the UTC offset for this timezone at this local time
    const tempDate = new Date(`${isoLocal}Z`); // treat as UTC temporarily
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    // Get what UTC looks like in the target timezone
    const parts = formatter.formatToParts(tempDate).reduce((acc, p) => {
        if (p.type !== "literal") acc[p.type] = parseInt(p.value);
        return acc;
    }, {} as Record<string, number>);

    // Compute the offset: local - utc
    const utcY = tempDate.getUTCFullYear(), utcM = tempDate.getUTCMonth() + 1, utcD = tempDate.getUTCDate();
    const utcH = tempDate.getUTCHours(), utcMin = tempDate.getUTCMinutes(), utcS = tempDate.getUTCSeconds();

    const utcMs = Date.UTC(utcY, utcM - 1, utcD, utcH, utcMin, utcS);
    const localMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const offsetMs = localMs - utcMs;

    // Now build the real date: local time minus the offset
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offsetMs);
}

/**
 * Get the calendar date (year, month, day) of a Date in a given timezone.
 */
function getDatePartsInTimezone(date: Date, timezone: string): { year: number; month: number; day: number; dayOfWeek: number } {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    });

    const parts = formatter.formatToParts(date).reduce((acc, p) => {
        if (p.type !== "literal") acc[p.type] = p.value;
        return acc;
    }, {} as Record<string, string>);

    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    return {
        year: parseInt(parts.year),
        month: parseInt(parts.month),
        day: parseInt(parts.day),
        dayOfWeek: weekdayMap[parts.weekday],
    };
}

function subtractOooOverlap(
    periodStart: Date,
    periodEnd: Date,
    periodSeconds: number,
    outOfOffice: [Date, Date][]
): number {
    for (const [oooStart, oooEnd] of outOfOffice) {
        const overlapStart = new Date(Math.max(periodStart.getTime(), oooStart.getTime()));
        const overlapEnd = new Date(Math.min(periodEnd.getTime(), oooEnd.getTime()));

        if (overlapStart < overlapEnd) {
            const overlapSeconds = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 1000);
            periodSeconds -= overlapSeconds;
        }
    }
    return periodSeconds;
}

export function calculateOfficeEndTime({
                                           from,
                                           hoursToWork,
                                           timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
                                           workStart = "09:00:00",
                                           workEnd = "18:00:00",
                                           lunchStart = "12:00:00",
                                           lunchEnd = "13:00:00",
                                           outOfOffice = [],
                                           weekendDays = [0, 6],
                                       }: CalculateOfficeEndTimeParams): Date {
    // Validate inputs
    if (!from || !hoursToWork || hoursToWork <= 0) {
        throw new Error("Invalid input: from and hoursToWork must be valid and positive");
    }
    if (timeToSeconds(workStart) >= timeToSeconds(workEnd)) {
        throw new Error("Invalid work time: workStart must be before workEnd");
    }
    if (timeToSeconds(lunchStart) >= timeToSeconds(lunchEnd)) {
        throw new Error("Invalid lunch time: lunchStart must be before lunchEnd");
    }
    if (timeToSeconds(lunchStart) < timeToSeconds(workStart) || timeToSeconds(lunchEnd) > timeToSeconds(workEnd)) {
        throw new Error("Lunch time must be within work hours");
    }

    let remainingSeconds = Math.floor(hoursToWork * 3600);
    const MAX_ITERATIONS = 365;
    let iterationCount = 0;

    // Get starting calendar date in the target timezone
    let { year, month, day } = getDatePartsInTimezone(from, timezone);

    while (remainingSeconds > 0 && iterationCount < MAX_ITERATIONS) {
        iterationCount++;

        const { dayOfWeek } = getDatePartsInTimezone(
            makeDateInTimezone(year, month, day, "12:00:00", timezone),
            timezone
        );

        if (!weekendDays.includes(dayOfWeek)) {
            const workDayStart = makeDateInTimezone(year, month, day, workStart, timezone);
            const workDayEnd   = makeDateInTimezone(year, month, day, workEnd, timezone);
            const lunchStartTs = makeDateInTimezone(year, month, day, lunchStart, timezone);
            const lunchEndTs   = makeDateInTimezone(year, month, day, lunchEnd, timezone);

            // === MORNING SHIFT: workStart → lunchStart ===
            let periodStart = new Date(Math.max(from.getTime(), workDayStart.getTime()));
            let periodEnd   = lunchStartTs;

            if (periodStart < periodEnd) {
                let periodSeconds = Math.floor((periodEnd.getTime() - periodStart.getTime()) / 1000);

                if (outOfOffice.length > 0) {
                    periodSeconds = subtractOooOverlap(periodStart, periodEnd, periodSeconds, outOfOffice);
                }

                if (periodSeconds >= remainingSeconds) {
                    return new Date(periodStart.getTime() + remainingSeconds * 1000);
                }

                remainingSeconds -= periodSeconds;
            }

            // === AFTERNOON SHIFT: lunchEnd → workEnd ===
            if (remainingSeconds > 0) {
                periodStart = new Date(Math.max(from.getTime(), lunchEndTs.getTime()));
                periodEnd   = workDayEnd;

                if (periodStart < periodEnd) {
                    let periodSeconds = Math.floor((periodEnd.getTime() - periodStart.getTime()) / 1000);

                    if (outOfOffice.length > 0) {
                        periodSeconds = subtractOooOverlap(periodStart, periodEnd, periodSeconds, outOfOffice);
                    }

                    if (periodSeconds >= remainingSeconds) {
                        return new Date(periodStart.getTime() + remainingSeconds * 1000);
                    }

                    remainingSeconds -= periodSeconds;
                }
            }
        }

        // Advance to next calendar day
        const next = new Date(makeDateInTimezone(year, month, day, "12:00:00", timezone).getTime() + 24 * 60 * 60 * 1000);
        ({ year, month, day } = getDatePartsInTimezone(next, timezone));
    }

    if (iterationCount >= MAX_ITERATIONS) {
        throw new Error(`Could not calculate end time within ${MAX_ITERATIONS} days`);
    }

    throw new Error("Unexpected error: could not calculate office end time");
}