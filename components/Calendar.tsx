'use client';

import { useState } from 'react';
import { MonthGrid } from './MonthGrid';
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

  const startDate = addMonths(new Date(), currentMonthOffset);
  const monthsBack = 12;
  const monthsForward = 24;
  const prevMonth = addMonths(startDate, -1);
  const nextMonth = addMonths(startDate, 1);

  return (
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
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
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white dark:bg-zinc-900">
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonthOffset((m) => Math.max(-monthsBack, m - 1))}
            disabled={currentMonthOffset === -monthsBack}
            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {format(prevMonth, 'MMMM')}
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonthOffset((m) => Math.min(monthsForward - 1, m + 1))}
            disabled={currentMonthOffset >= monthsForward - 1}
            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {format(nextMonth, 'MMMM')}
          </button>
        </div>
      </div>
      <div className="md:min-h-0 md:flex-1 md:flex md:flex-col">
        <MonthGrid
          startMonth={startDate}
          onDayClick={onDayClick}
          bankHolidays={bankHolidays}
          events={events}
          profiles={profiles}
        />
      </div>
    </div>
  );
}
