import {
  addYears,
  isBefore,
  isAfter,
  setMonth,
  setDate,
  addDays,
  isWeekend,
} from 'date-fns';
import type { Profile, Event } from './types';

function getResetDate(year: number, day: number, month: number): Date {
  return setDate(setMonth(new Date(year, 0, 1), month - 1), day);
}

function getPeriod(profile: Profile, type: 'holiday' | 'work_from_abroad', offsetYears: number) {
  const now = new Date();
  const isHoliday = type === 'holiday';
  const day = isHoliday ? profile.holiday_reset_day : profile.wfa_reset_day;
  const month = isHoliday ? profile.holiday_reset_month : profile.wfa_reset_month;

  let periodStart = getResetDate(now.getFullYear(), day, month);
  if (isBefore(now, periodStart)) {
    periodStart = getResetDate(now.getFullYear() - 1, day, month);
  }
  periodStart = addYears(periodStart, offsetYears);
  const periodEnd = addYears(periodStart, 1);

  return { periodStart, periodEnd };
}

function businessDaysInEventWithinPeriod(
  eventStart: Date,
  eventEnd: Date,
  periodStart: Date,
  periodEnd: Date
): number {
  const start = isBefore(eventStart, periodStart) ? periodStart : eventStart;
  const end = isAfter(eventEnd, periodEnd) ? periodEnd : eventEnd;
  if (isAfter(start, end)) return 0;
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    if (!isWeekend(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

export function calculateBalance(
  profile: Profile,
  events: Event[]
): {
  holidayBalance: number;
  wfaBalance: number;
  nextPeriodHolidayBalance: number;
  nextPeriodWfaBalance: number;
  showNextPeriodHoliday: boolean;
  showNextPeriodWfa: boolean;
} {
  const holidayPeriod = getPeriod(profile, 'holiday', 0);
  const wfaPeriod = getPeriod(profile, 'work_from_abroad', 0);
  const nextHolidayPeriod = getPeriod(profile, 'holiday', 1);
  const nextWfaPeriod = getPeriod(profile, 'work_from_abroad', 1);

  let holidayUsed = 0;
  let wfaUsed = 0;
  let nextPeriodHolidayUsed = 0;
  let nextPeriodWfaUsed = 0;

  const myEvents = events.filter((e) => e.user_ids.includes(profile.id));

  for (const event of myEvents) {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (event.type === 'holiday') {
      holidayUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        holidayPeriod.periodStart,
        holidayPeriod.periodEnd
      );
      nextPeriodHolidayUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        nextHolidayPeriod.periodStart,
        nextHolidayPeriod.periodEnd
      );
    } else {
      wfaUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        wfaPeriod.periodStart,
        wfaPeriod.periodEnd
      );
      nextPeriodWfaUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        nextWfaPeriod.periodStart,
        nextWfaPeriod.periodEnd
      );
    }
  }

  return {
    holidayBalance: Math.max(0, profile.holiday_allowance_days - holidayUsed),
    wfaBalance: Math.max(0, profile.work_from_abroad_days - wfaUsed),
    nextPeriodHolidayBalance: Math.max(
      0,
      profile.holiday_allowance_days - nextPeriodHolidayUsed
    ),
    nextPeriodWfaBalance: Math.max(
      0,
      profile.work_from_abroad_days - nextPeriodWfaUsed
    ),
    showNextPeriodHoliday: nextPeriodHolidayUsed > 0,
    showNextPeriodWfa: nextPeriodWfaUsed > 0,
  };
}
