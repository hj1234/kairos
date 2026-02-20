'use client';

import { format } from 'date-fns';
import type { Event } from '@/lib/types';
import { getUserColor } from '@/lib/user-colors';

interface Profile {
  id: string;
  display_name: string;
}

interface EventListViewProps {
  events: Event[];
  profiles: Profile[];
  onEventClick: (event: Event) => void;
  onAddClick: () => void;
}

export function EventListView({
  events,
  profiles,
  onEventClick,
  onAddClick,
}: EventListViewProps) {
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]));
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
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
        <h2 className="text-lg font-semibold">Events</h2>
        <button
          type="button"
          onClick={onAddClick}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add event
        </button>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-800 dark:bg-zinc-900">
        {sortedEvents.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            No events yet. Tap &quot;Add event&quot; to create one.
          </li>
        ) : (
          sortedEvents.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onEventClick(event)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-sm ${
                    event.type === 'holiday' ? '' : 'border bg-transparent'
                  }`}
                  style={{
                    ...(event.type === 'holiday'
                      ? { backgroundColor: getUserColor(event.user_ids[0]) }
                      : { borderColor: getUserColor(event.user_ids[0]) }),
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {event.name || event.type.replace('_', ' ')}
                  </p>
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
                        · {event.type.replace('_', ' ')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {event.user_ids.map((uid) => (
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
          ))
        )}
      </ul>
    </div>
  );
}
