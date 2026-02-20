'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from './Calendar';
import { EventListView } from './EventListView';
import { EventForm } from './EventForm';
import type { BankHoliday } from '@/lib/types';
import type { Event } from '@/lib/types';

interface Profile {
  id: string;
  display_name: string;
}

interface EventsSectionProps {
  bankHolidays: BankHoliday[];
  events: Event[];
  profiles: Profile[];
}

export function EventsSection({
  bankHolidays,
  events,
  profiles,
}: EventsSectionProps) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayEvents, setDayEvents] = useState<Event[]>([]);

  const openFormForEvent = (event: Event) => {
    setSelectedDate(new Date(event.start_date));
    setDayEvents([event]);
    setFormOpen(true);
  };

  const openFormForDay = (date: Date, eventsForDay: Event[]) => {
    setSelectedDate(date);
    setDayEvents(eventsForDay);
    setFormOpen(true);
  };

  const openFormForNew = () => {
    setSelectedDate(new Date());
    setDayEvents([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setDayEvents([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            view === 'calendar'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          Calendar
        </button>
        <button
          type="button"
          onClick={() => setView('list')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            view === 'list'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          List
        </button>
      </div>

      {view === 'calendar' ? (
        <Calendar
          bankHolidays={bankHolidays}
          events={events}
          profiles={profiles}
          onDayClick={openFormForDay}
        />
      ) : (
        <EventListView
          events={events}
          profiles={profiles}
          onEventClick={openFormForEvent}
          onAddClick={openFormForNew}
        />
      )}

      {formOpen && (
        <EventForm
          initialDate={selectedDate}
          dayEvents={dayEvents}
          onClose={closeForm}
          onSaved={closeForm}
        />
      )}
    </div>
  );
}
