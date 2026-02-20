'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import type { BankHoliday } from '@/lib/types';
import type { Event } from '@/lib/types';
import { getUserColor } from '@/lib/user-colors';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthGridProps {
  startMonth: Date;
  onDayClick: (date: Date, dayEvents: Event[]) => void;
  bankHolidays?: BankHoliday[];
  events?: Event[];
  profiles?: { id: string; display_name: string }[];
}

export function MonthGrid({
  startMonth,
  onDayClick,
  bankHolidays = [],
  events = [],
  profiles = [],
}: MonthGridProps) {
  const monthStart = startOfMonth(startMonth);
  const monthEnd = endOfMonth(startMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const bhSet = new Set(bankHolidays.map((b) => b.date));
  const eventsByDate = new Map<string, Event[]>();
  for (const e of events) {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    let cur = new Date(start);
    while (cur <= end) {
      const key = format(cur, 'yyyy-MM-dd');
      if (!eventsByDate.has(key)) eventsByDate.set(key, []);
      eventsByDate.get(key)!.push(e);
      cur.setDate(cur.getDate() + 1);
    }
  }

  const days: Date[] = [];
  let day = new Date(calendarStart);
  while (day <= calendarEnd) {
    days.push(new Date(day));
    day = addDays(day, 1);
  }

  const isHalfDayOnDate = (e: Event, dateStr: string): boolean => {
    if (e.start_date === e.end_date) return !!(e.start_half_day || e.end_half_day);
    if (dateStr === e.start_date) return !!e.start_half_day;
    if (dateStr === e.end_date) return !!e.end_half_day;
    return false;
  };

  const getEventIndicators = (dateStr: string) => {
    const evs = eventsByDate.get(dateStr) || [];
    const byUser = new Map<string, { holiday: boolean; holidayHalfDay: boolean; wfa: boolean; wfaHalfDay: boolean }>();
    for (const e of evs) {
      const halfDay = isHalfDayOnDate(e, dateStr);
      for (const uid of e.user_ids) {
        if (!byUser.has(uid)) byUser.set(uid, { holiday: false, holidayHalfDay: false, wfa: false, wfaHalfDay: false });
        const u = byUser.get(uid)!;
        if (e.type === 'holiday') {
          u.holiday = true;
          u.holidayHalfDay = halfDay;
        }
        if (e.type === 'work_from_abroad') {
          u.wfa = true;
          u.wfaHalfDay = halfDay;
        }
      }
    }
    return Array.from(byUser.entries()).map(([userId, types]) => ({
      userId,
      color: getUserColor(userId),
      ...types,
    }));
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-[280px] p-3">
        <h3 className="mb-3 text-center font-medium">
          {format(startMonth, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium text-zinc-500"
            >
              {d}
            </div>
          ))}
          {days.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(d, startMonth);
            const isToday = isSameDay(d, new Date());
            const isBankHoliday = bhSet.has(dateStr);
            const dayEvents = eventsByDate.get(dateStr) || [];
            const indicators = getEventIndicators(dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onDayClick(d, dayEvents)}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg p-1 text-sm transition-colors touch-manipulation ${
                  isCurrentMonth
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500'
                } ${isToday ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : ''} ${
                  dayEvents.length && !isToday ? 'ring-1 ring-zinc-200 dark:ring-zinc-700' : ''
                }`}
              >
                <span>{format(d, 'd')}</span>
                {isBankHoliday && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-red-500" />
                )}
                {dayEvents.length > 0 && (
                  <div className="mt-1 flex w-full max-w-[20px] flex-col items-center gap-0.5">
                    {indicators.map(({ userId, color, holiday, holidayHalfDay, wfa, wfaHalfDay }) => (
                      <div key={userId} className="flex w-full flex-col items-center gap-0.5">
                        {holiday && (
                          <span
                            className={`h-1 rounded-sm ${holidayHalfDay ? 'w-1/2' : 'w-full'}`}
                            style={{ backgroundColor: color }}
                          />
                        )}
                        {wfa && (
                          <span
                            className={`h-1 rounded-sm border bg-transparent ${wfaHalfDay ? 'w-1/2' : 'w-full'}`}
                            style={{ borderColor: color }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
