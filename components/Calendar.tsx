'use client';

import { useState } from 'react';
import { MonthGrid } from './MonthGrid';
import { YearGrid } from './YearGrid';
import { addMonths, format } from 'date-fns';
import type { BankHoliday } from '@/lib/types';
import type { Event } from '@/lib/types';
import { BankHolidayBadge } from './BankHolidayBadge';
import { getUserColor } from '@/lib/user-colors';

interface Profile {
  id: string;
  display_name: string;
}

interface CalendarProps {
  bankHolidays: BankHoliday[];
  events: Event[];
  profiles: Profile[];
  onDayClick: (date: Date, dayEvents: Event[]) => void;
  view: 'calendar' | 'list';
  onViewChange: (view: 'calendar' | 'list') => void;
}

export function Calendar({ bankHolidays, events, profiles, onDayClick, view, onViewChange }: CalendarProps) {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [currentYearOffset, setCurrentYearOffset] = useState(0);
  const [calendarMode, setCalendarMode] = useState<'monthly' | 'yearly'>('monthly');

  const startDate = addMonths(new Date(), currentMonthOffset);
  const displayYear = new Date().getFullYear() + currentYearOffset;
  const monthsBack = 12;
  const monthsForward = 24;
  const yearsBack = 2;
  const yearsForward = 2;
  const prevMonth = addMonths(startDate, -1);
  const nextMonth = addMonths(startDate, 1);

  return (
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1">
      <div className="flex shrink-0 flex-col gap-2 md:grid md:grid-cols-3 md:items-center md:gap-4">
        {/* Mobile: row 1 - calendar/list + month buttons. Desktop: left-aligned (order 1) */}
        <div className="flex items-center justify-between gap-2 md:contents">
          <div className="flex gap-2 md:order-1 md:justify-self-start">
            <button
              type="button"
              onClick={() => onViewChange('calendar')}
              aria-label="Calendar view"
              className={`rounded-lg p-2 transition-colors ${
                view === 'calendar'
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              aria-label="List view"
              className={`rounded-lg p-2 transition-colors ${
                view === 'list'
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2 md:order-3 md:justify-self-end">
            {calendarMode === 'monthly' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentMonthOffset((m) => Math.max(-monthsBack, m - 1))}
                  disabled={currentMonthOffset === -monthsBack}
                  className="min-w-[7.5rem] rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {format(prevMonth, 'MMMM')}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonthOffset((m) => Math.min(monthsForward - 1, m + 1))}
                  disabled={currentMonthOffset >= monthsForward - 1}
                  className="min-w-[7.5rem] rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {format(nextMonth, 'MMMM')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentYearOffset((y) => Math.max(-yearsBack, y - 1))}
                  disabled={currentYearOffset === -yearsBack}
                  className="min-w-[7.5rem] rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {displayYear - 1}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentYearOffset((y) => Math.min(yearsForward, y + 1))}
                  disabled={currentYearOffset >= yearsForward}
                  className="min-w-[7.5rem] rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {displayYear + 1}
                </button>
              </>
            )}
          </div>
        </div>
        {/* Legend - full width on mobile (row 2), centered on desktop (order 2) */}
        <div className="flex w-full flex-wrap items-center justify-center gap-3 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white dark:bg-zinc-900 md:order-2 md:w-auto md:justify-self-center">
          {[...profiles]
            .sort((a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()))
            .map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getUserColor(p.id) }}
              />
              {p.display_name}
            </span>
            ))}
          <span className="mx-1 h-3 w-px bg-zinc-600" />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-2 rounded-sm bg-white" />
            Holiday
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-2 rounded-sm border border-white bg-transparent" />
            Remote work
          </span>
          <BankHolidayBadge className="text-white" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex md:min-h-0 md:flex-1 md:flex-col">
        <div className="relative flex shrink-0 items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
          <div className="flex gap-1 rounded-lg bg-zinc-200 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setCalendarMode('monthly')}
              aria-label="Monthly view"
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                calendarMode === 'monthly'
                  ? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('yearly')}
              aria-label="Yearly view"
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                calendarMode === 'yearly'
                  ? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Year
            </button>
          </div>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-zinc-900 dark:text-zinc-100">
            {calendarMode === 'monthly' ? format(startDate, 'MMMM yyyy') : displayYear}
          </span>
          <div className="w-[5.5rem]" aria-hidden />
        </div>
        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
          {calendarMode === 'monthly' ? (
            <MonthGrid
              embedded
              startMonth={startDate}
              onDayClick={onDayClick}
              bankHolidays={bankHolidays}
              events={events}
              profiles={profiles}
            />
          ) : (
            <YearGrid
              embedded
              year={displayYear}
              onDayClick={onDayClick}
              bankHolidays={bankHolidays}
              events={events}
              profiles={profiles}
            />
          )}
        </div>
      </div>
    </div>
  );
}
