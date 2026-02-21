'use client';

import { useState, useMemo } from 'react';
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
import { getEventTypeDisplayName, type BankHoliday, type Event } from '@/lib/types';
import { getUserColor } from '@/lib/user-colors';
import { businessDaysInEvent } from '@/lib/balance';
import { EventTypeIndicator } from './EventTypeIndicator';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthGridProps {
  startMonth: Date;
  onDayClick: (date: Date, dayEvents: Event[]) => void;
  bankHolidays?: BankHoliday[];
  events?: Event[];
  profiles?: { id: string; display_name: string }[];
  /** When true, month uses natural height (for scrollable multi-month view on desktop) */
  compact?: boolean;
  /** When true, render without outer border/header (parent provides them) */
  embedded?: boolean;
}

export function MonthGrid({
  startMonth,
  onDayClick,
  bankHolidays = [],
  events = [],
  profiles = [],
  compact = false,
  embedded = false,
}: MonthGridProps) {
  const monthStart = startOfMonth(startMonth);
  const monthEnd = endOfMonth(startMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const bhSet = new Set(bankHolidays.map((b) => b.date));
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      let cur = new Date(start);
      while (cur <= end) {
        const key = format(cur, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [events]);

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

  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  const highlightedDates = useMemo(() => {
    if (!hoveredDateStr) return new Set<string>();
    const evs = eventsByDate.get(hoveredDateStr) || [];
    const dates = new Set<string>();
    for (const e of evs) {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      let cur = new Date(start);
      while (cur <= end) {
        dates.add(format(cur, 'yyyy-MM-dd'));
        cur.setDate(cur.getDate() + 1);
      }
    }
    return dates;
  }, [hoveredDateStr, eventsByDate]);

  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]));

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
        if (e.type === 'remote_work') {
          u.wfa = true;
          u.wfaHalfDay = halfDay;
        }
      }
    }
    return Array.from(byUser.entries())
      .sort(([a], [b]) => {
        const nameA = (profileMap.get(a) ?? '').toLowerCase();
        const nameB = (profileMap.get(b) ?? '').toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .map(([userId, types]) => ({
        userId,
        color: getUserColor(userId),
        ...types,
      }));
  };

  return (
    <div className={`overflow-x-auto ${embedded ? 'flex min-h-0 flex-1 flex-col' : ''} ${embedded ? '' : 'rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'} ${compact || embedded ? '' : 'md:flex md:min-h-0 md:flex-1 md:flex-col'}`}>
      <div className={`min-w-[280px] p-3 ${embedded ? 'flex min-h-0 flex-1 flex-col' : ''} ${compact || embedded ? '' : 'md:flex md:min-h-0 md:flex-1 md:flex-col'}`}>
        {!embedded && (
        <h3 className="mb-3 shrink-0 text-center font-medium">
          {format(startMonth, 'MMMM yyyy')}
        </h3>
        )}
        <div className={`grid grid-cols-7 gap-1 ${compact ? '' : embedded ? 'min-h-0 flex-1 auto-rows-fr' : 'md:min-h-0 md:flex-1 md:auto-rows-fr'}`}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium text-zinc-500"
            >
              {d}
            </div>
          ))}
          {days.map((d, dayIndex) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(d, startMonth);
            const isToday = isSameDay(d, new Date());
            const isBankHoliday = bhSet.has(dateStr);
            const dayEvents = eventsByDate.get(dateStr) || [];
            const indicators = getEventIndicators(dateStr);
            const isInTopHalf = dayIndex < 14;
            const tooltipAbove = !isInTopHalf;
            const isHighlighted = hoveredDateStr !== null && highlightedDates.has(dateStr);

            return (
              <div
                key={dateStr}
                className="group relative flex min-h-0 flex-col"
                onMouseEnter={() => dayEvents.length > 0 && setHoveredDateStr(dateStr)}
                onMouseLeave={() => setHoveredDateStr(null)}
              >
                <button
                  type="button"
                  onClick={() => onDayClick(d, dayEvents)}
                  className={`flex min-h-[44px] w-full flex-col items-center justify-center rounded-lg p-1 text-sm transition-colors touch-manipulation hover:bg-zinc-100 dark:hover:bg-zinc-800 ${compact ? '' : 'md:flex-1 md:min-h-0'} ${
                    isHighlighted ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                  } ${
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
                {dayEvents.length > 0 && (
                  <div
                    className={`pointer-events-none invisible absolute left-1/2 z-50 min-w-[200px] max-w-[280px] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-0 shadow-lg group-hover:visible dark:border-zinc-700 dark:bg-zinc-900 ${
                      tooltipAbove ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                  >
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {dayEvents.map((e) => {
                        const daysUsed = businessDaysInEvent(e);
                        const daysText = daysUsed === 1 ? '1 day' : daysUsed % 1 === 0 ? `${Math.round(daysUsed)} days` : `${daysUsed.toFixed(1)} days`;
                        return (
                          <div
                            key={e.id}
                            className="flex items-start gap-3 px-4 py-3 text-left"
                          >
                            <EventTypeIndicator event={e} className="mt-0.5" profileMap={profileMap} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {e.name || getEventTypeDisplayName(e.type)}
                                </p>
                                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                                  {daysText}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {[...e.user_ids]
                                  .sort((a, b) => {
                                    const nameA = (profileMap.get(a) ?? '').toLowerCase();
                                    const nameB = (profileMap.get(b) ?? '').toLowerCase();
                                    return nameA.localeCompare(nameB);
                                  })
                                  .map((uid) => (
                                  <span
                                    key={uid}
                                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: `${getUserColor(uid)}20`,
                                      color: getUserColor(uid),
                                    }}
                                  >
                                    {profileMap.get(uid) ?? 'Unknown'}
                                  </span>
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
