'use client';

import { useState } from 'react';
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
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1">
      {view === 'calendar' ? (
        <Calendar
          view={view}
          onViewChange={setView}
          bankHolidays={bankHolidays}
          events={events}
          profiles={profiles}
          onDayClick={openFormForDay}
        />
      ) : (
        <EventListView
          bankHolidays={bankHolidays}
          events={events}
          profiles={profiles}
          onEventClick={openFormForEvent}
          onAddClick={openFormForNew}
          view={view}
          onViewChange={setView}
        />
      )}

      {formOpen && (
        <EventForm
          bankHolidays={bankHolidays}
          events={events}
          initialDate={selectedDate}
          dayEvents={dayEvents}
          onClose={closeForm}
          onSaved={closeForm}
        />
      )}
    </div>
  );
}
