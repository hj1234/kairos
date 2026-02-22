'use client';

import { Calendar } from './Calendar';
import type { BankHoliday } from '@/lib/types';
import type { Event } from '@/lib/types';

const MOCK_PROFILES = [
  { id: 'preview-user-1', display_name: 'Alex' },
  { id: 'preview-user-2', display_name: 'Sam' },
];

/** Mock events for landing page preview - shows sample holidays and remote work */
function getMockEvents(): Event[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const baseDate = new Date(year, month, 1);

  return [
    {
      id: 'preview-1',
      user_ids: ['preview-user-1'],
      type: 'holiday',
      name: 'Summer break',
      start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 12).toISOString().slice(0, 10),
      end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 19).toISOString().slice(0, 10),
      created_by: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'preview-2',
      user_ids: ['preview-user-2'],
      type: 'remote_work',
      name: 'Work from abroad',
      start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 22).toISOString().slice(0, 10),
      end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 26).toISOString().slice(0, 10),
      created_by: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'preview-3',
      user_ids: ['preview-user-1', 'preview-user-2'],
      type: 'holiday',
      name: 'Weekend away',
      start_half_day: true,
      end_half_day: true,
      start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 5).toISOString().slice(0, 10),
      end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 7).toISOString().slice(0, 10),
      created_by: null,
      created_at: new Date().toISOString(),
    },
  ];
}

interface CalendarPreviewProps {
  bankHolidays: BankHoliday[];
}

export function CalendarPreview({ bankHolidays }: CalendarPreviewProps) {
  const mockEvents = getMockEvents();

  return (
    <div className="pointer-events-none select-none opacity-95">
      <Calendar
        view="calendar"
        onViewChange={() => {}}
        bankHolidays={bankHolidays}
        events={mockEvents}
        profiles={MOCK_PROFILES}
        onDayClick={() => {}}
      />
    </div>
  );
}
