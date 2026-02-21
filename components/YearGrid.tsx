'use client';

import { useMemo } from 'react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { getEventTypeDisplayName, type BankHoliday, type Event } from '@/lib/types';
import { getUserColor } from '@/lib/user-colors';
import { businessDaysInEvent } from '@/lib/balance';
import { EventTypeIndicator } from './EventTypeIndicator';

interface YearGridProps {
  year: number;
  onDayClick: (date: Date, dayEvents: Event[]) => void;
  bankHolidays?: BankHoliday[];
  events?: Event[];
  profiles?: { id: string; display_name: string }[];
  /** When true, render without outer border/header (parent provides them) */
  embedded?: boolean;
}

export function YearGrid({
  year,
  onDayClick,
  bankHolidays = [],
  events = [],
  profiles = [],
  embedded = false,
}: YearGridProps) {
  const bhSet = useMemo(() => new Set(bankHolidays.map((b) => b.date)), [bankHolidays]);

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

  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p.display_name])), [profiles]);

  const getEventIndicators = (dateStr: string) => {
    const evs = eventsByDate.get(dateStr) || [];
    const byUser = new Map<string, { holiday: boolean; wfa: boolean }>();
    for (const e of evs) {
      for (const uid of e.user_ids) {
        if (!byUser.has(uid)) byUser.set(uid, { holiday: false, wfa: false });
        const u = byUser.get(uid)!;
        if (e.type === 'holiday') u.holiday = true;
        if (e.type === 'remote_work') u.wfa = true;
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

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthStart = startOfMonth(new Date(year, i, 1));
    const daysInMonth = getDaysInMonth(monthStart);
    const days: { dateStr: string; day: number; events: Event[]; indicators: ReturnType<typeof getEventIndicators>; isBankHoliday: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = format(new Date(year, i, d), 'yyyy-MM-dd');
      const dayEvents = eventsByDate.get(dateStr) || [];
      const indicators = getEventIndicators(dateStr);
      const isBankHoliday = bhSet.has(dateStr);
      if (dayEvents.length > 0 || isBankHoliday) {
        days.push({ dateStr, day: d, events: dayEvents, indicators, isBankHoliday });
      }
    }
    return { month: monthStart, monthName: format(monthStart, 'MMMM'), days };
  });

  return (
    <div className={`overflow-x-auto ${embedded ? 'flex min-h-0 flex-1 flex-col' : ''} ${embedded ? '' : 'rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'} ${embedded ? '' : 'md:flex md:min-h-0 md:flex-1 md:flex-col'}`}>
      <div className={`min-w-[280px] p-3 ${embedded ? 'flex min-h-0 flex-1 flex-col' : ''} ${embedded ? '' : 'md:flex md:min-h-0 md:flex-1 md:flex-col'}`}>
        {!embedded && <h3 className="mb-3 shrink-0 text-center font-medium">{year}</h3>}
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:grid-rows-3 ${embedded ? 'min-h-0 flex-1' : 'md:min-h-0 md:flex-1'}`}>
          {months.map(({ month, monthName, days }) => (
            <button
              key={monthName}
              type="button"
              onClick={() => onDayClick(month, [])}
              className="flex min-h-0 flex-col rounded-lg border border-zinc-200 p-2 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 md:overflow-hidden"
            >
              <span className="mb-2 shrink-0 text-xs font-medium text-zinc-700 dark:text-zinc-300">{monthName}</span>
              <div className="flex min-h-[48px] flex-1 flex-wrap gap-2 overflow-y-auto md:min-h-0">
                {days.length === 0 ? (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                ) : (
                  days.map(({ dateStr, day, events: dayEvents, indicators, isBankHoliday }) => (
                    <div key={dateStr} className="group relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDayClick(new Date(dateStr), dayEvents);
                        }}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">{day}</span>
                        {isBankHoliday && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                        <div className="flex gap-0.5">
                          {indicators.map(({ userId, color, holiday, wfa }) => (
                            <span key={userId} className="flex gap-0.5">
                              {holiday && (
                                <span
                                  className="h-2 w-2 rounded-sm"
                                  style={{ backgroundColor: color }}
                                />
                              )}
                              {wfa && (
                                <span
                                  className="h-2 w-2 rounded-sm border bg-transparent"
                                  style={{ borderColor: color }}
                                />
                              )}
                            </span>
                          ))}
                        </div>
                      </button>
                      {dayEvents.length > 0 && (
                        <div className="pointer-events-none invisible absolute left-1/2 z-50 min-w-[200px] max-w-[280px] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-0 shadow-lg group-hover:visible dark:border-zinc-700 dark:bg-zinc-900 bottom-full mb-1">
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
                  ))
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
