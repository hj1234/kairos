'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { isBefore, startOfDay } from 'date-fns';
import { getEventTypeDisplayName, type BankHoliday, type Event } from '@/lib/types';
import { getUserColor } from '@/lib/user-colors';
import { businessDaysInEvent } from '@/lib/balance';
import { EventTypeIndicator } from './EventTypeIndicator';

interface Profile {
  id: string;
  display_name: string;
}

interface EventListViewProps {
  bankHolidays?: BankHoliday[];
  events: Event[];
  profiles: Profile[];
  onEventClick: (event: Event) => void;
  onAddClick: () => void;
  view?: 'calendar' | 'list';
  onViewChange?: (view: 'calendar' | 'list') => void;
}

export function EventListView({
  bankHolidays = [],
  events,
  profiles,
  onEventClick,
  onAddClick,
  view = 'list',
  onViewChange,
}: EventListViewProps) {
  const [pastExpanded, setPastExpanded] = useState(false);
  const [futureExpanded, setFutureExpanded] = useState(true);

  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]));
  const today = startOfDay(new Date());

  const { pastEvents, futureEvents } = [...events]
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .reduce<{ pastEvents: Event[]; futureEvents: Event[] }>(
      (acc, event) => {
        const endDate = new Date(event.end_date);
        if (isBefore(endDate, today)) {
          acc.pastEvents.push(event);
        } else {
          acc.futureEvents.push(event);
        }
        return acc;
      },
      { pastEvents: [], futureEvents: [] }
    );

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (start === end) {
      return format(startDate, 'd MMM yyyy');
    }
    return `${format(startDate, 'd MMM')} – ${format(endDate, 'd MMM yyyy')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onViewChange && (
            <>
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
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onAddClick}
          aria-label="Add event"
          className="rounded-lg bg-zinc-200 p-2 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {pastEvents.length === 0 && futureEvents.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No events yet. Tap &quot;Add event&quot; to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {pastEvents.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setPastExpanded((e) => !e)}
                className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className={`h-4 w-4 transition-transform ${pastExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Past
                </span>
                <span className="text-sm font-normal text-zinc-500">
                  {pastEvents.length} {pastEvents.length === 1 ? 'event' : 'events'}
                </span>
              </button>
              {pastExpanded && (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {pastEvents.map((event) => {
                    const daysUsed = businessDaysInEvent(event, bankHolidays);
                    const daysText = daysUsed === 1 ? '1 day' : daysUsed % 1 === 0 ? `${Math.round(daysUsed)} days` : `${daysUsed.toFixed(1)} days`;
                    return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onEventClick(event)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <EventTypeIndicator event={event} profileMap={profileMap} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {event.name || getEventTypeDisplayName(event.type)}
                            </p>
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                              {daysText}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500">
                            {formatDateRange(event.start_date, event.end_date)}
                            {(event.start_half_day || event.end_half_day) && (
                              <span className="ml-1">
                                · {event.start_date === event.end_date
                                  ? 'Half day'
                                  : event.start_half_day && event.end_half_day
                                    ? 'Start & end half'
                                    : event.start_half_day
                                      ? 'Start half'
                                      : 'End half'}
                              </span>
                            )}
                            {event.name && (
                              <span className="ml-1 capitalize">
                                · {getEventTypeDisplayName(event.type)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {[...event.user_ids]
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
                      </button>
                    </li>
                  );
                  })}
                </ul>
              )}
            </div>
          )}
          {futureEvents.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setFutureExpanded((e) => !e)}
                className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className={`h-4 w-4 transition-transform ${futureExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Future
                </span>
                <span className="text-sm font-normal text-zinc-500">
                  {futureEvents.length} {futureEvents.length === 1 ? 'event' : 'events'}
                </span>
              </button>
              {futureExpanded && (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {futureEvents.map((event) => {
                  const daysUsed = businessDaysInEvent(event, bankHolidays);
                  const daysText = daysUsed === 1 ? '1 day' : daysUsed % 1 === 0 ? `${Math.round(daysUsed)} days` : `${daysUsed.toFixed(1)} days`;
                  return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onEventClick(event)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <EventTypeIndicator event={event} profileMap={profileMap} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {event.name || getEventTypeDisplayName(event.type)}
                          </p>
                          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                            {daysText}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {formatDateRange(event.start_date, event.end_date)}
                          {(event.start_half_day || event.end_half_day) && (
                            <span className="ml-1">
                              · {event.start_date === event.end_date
                                ? 'Half day'
                                : event.start_half_day && event.end_half_day
                                  ? 'Start & end half'
                                  : event.start_half_day
                                    ? 'Start half'
                                    : 'End half'}
                            </span>
                          )}
                          {event.name && (
                            <span className="ml-1 capitalize">
                              · {getEventTypeDisplayName(event.type)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {[...event.user_ids]
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
                    </button>
                  </li>
                );
                })}
              </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
