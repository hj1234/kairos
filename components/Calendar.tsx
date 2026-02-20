'use client';

import { useState } from 'react';
import { MonthGrid } from './MonthGrid';
import { addMonths } from 'date-fns';
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
}

export function Calendar({ bankHolidays, events, profiles, onDayClick }: CalendarProps) {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  const startDate = addMonths(new Date(), currentMonthOffset);
  const monthsBack = 12;
  const monthsForward = 24;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white dark:bg-zinc-900">
          {profiles.map((p) => (
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
            Work from abroad
          </span>
          <BankHolidayBadge className="text-white" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonthOffset((m) => Math.max(-monthsBack, m - 1))}
            disabled={currentMonthOffset === -monthsBack}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonthOffset((m) => Math.min(monthsForward - 1, m + 1))}
            disabled={currentMonthOffset >= monthsForward - 1}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Next
        </button>
        </div>
      </div>
      <MonthGrid
        startMonth={startDate}
        onDayClick={onDayClick}
        bankHolidays={bankHolidays}
        events={events}
        profiles={profiles}
      />
    </div>
  );
}
