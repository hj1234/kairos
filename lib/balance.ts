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
  periodEnd: Date,
  startHalfDay: boolean,
  endHalfDay: boolean
): number {
  const start = isBefore(eventStart, periodStart) ? periodStart : eventStart;
  const end = isAfter(eventEnd, periodEnd) ? periodEnd : eventEnd;
  if (isAfter(start, end)) return 0;

  const isSameDay = start.toDateString() === end.toDateString();
  let count = 0;
  let cur = new Date(start);
  let dayIndex = 0;
  const totalDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  while (cur <= end) {
    if (!isWeekend(cur)) {
      let multiplier = 1;
      if (isSameDay) {
        multiplier = startHalfDay || endHalfDay ? 0.5 : 1;
      } else {
        if (dayIndex === 0) multiplier = startHalfDay ? 0.5 : 1;
        else if (dayIndex === totalDays - 1) multiplier = endHalfDay ? 0.5 : 1;
      }
      count += multiplier;
    }
    cur = addDays(cur, 1);
    dayIndex++;
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
    const startHalfDay = event.start_half_day ?? false;
    const endHalfDay = event.end_half_day ?? false;

    if (event.type === 'holiday') {
      holidayUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        holidayPeriod.periodStart,
        holidayPeriod.periodEnd,
        startHalfDay,
        endHalfDay
      );
      nextPeriodHolidayUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        nextHolidayPeriod.periodStart,
        nextHolidayPeriod.periodEnd,
        startHalfDay,
        endHalfDay
      );
    } else {
      wfaUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        wfaPeriod.periodStart,
        wfaPeriod.periodEnd,
        startHalfDay,
        endHalfDay
      );
      nextPeriodWfaUsed += businessDaysInEventWithinPeriod(
        start,
        end,
        nextWfaPeriod.periodStart,
        nextWfaPeriod.periodEnd,
        startHalfDay,
        endHalfDay
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
