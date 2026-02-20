'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getEventTypeDisplayName, type EventType, type Event } from '@/lib/types';

interface EventFormProps {
  initialDate: Date;
  dayEvents: Event[];
  onClose: () => void;
  onSaved: () => void;
}

export function EventForm({ initialDate, dayEvents, onClose, onSaved }: EventFormProps) {
  const [editingEvent, setEditingEvent] = useState<Event | null>(
    dayEvents.length === 1 ? dayEvents[0] : null
  );
  const [type, setType] = useState<EventType>('holiday');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(format(initialDate, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(initialDate, 'yyyy-MM-dd'));
  const [startHalfDay, setStartHalfDay] = useState(false);
  const [endHalfDay, setEndHalfDay] = useState(false);
  const [forBoth, setForBoth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const [skipPicker, setSkipPicker] = useState(false);
  const isEditMode = editingEvent !== null;
  const showEventPicker = dayEvents.length > 1 && !editingEvent && !skipPicker;

  useEffect(() => {
    if (editingEvent) {
      setType(editingEvent.type);
      setName(editingEvent.name ?? '');
      setStartDate(editingEvent.start_date);
      setEndDate(editingEvent.end_date);
      setStartHalfDay(editingEvent.start_half_day ?? false);
      setEndHalfDay(editingEvent.end_half_day ?? false);
      setForBoth(editingEvent.user_ids.length > 1);
    } else if (dayEvents.length === 0) {
      setType('holiday');
      setStartDate(format(initialDate, 'yyyy-MM-dd'));
      setEndDate(format(initialDate, 'yyyy-MM-dd'));
      setStartHalfDay(false);
      setEndHalfDay(false);
    }
  }, [editingEvent, dayEvents.length, initialDate]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id')
        .eq('id', user.id)
        .single();
      if (!myProfile) return;
      const list: { id: string; display_name: string }[] = [
        { id: myProfile.id, display_name: myProfile.display_name },
      ];
      if (myProfile.partner_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', myProfile.partner_id)
          .single();
        if (partner) list.push(partner);
      }
      setProfiles(list);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const userIds = forBoth && profiles.length === 2
      ? profiles.map((p) => p.id)
      : [user.id];

    if (isEditMode && editingEvent) {
      // Update: check overlap excluding current event
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('type', type)
        .overlaps('user_ids', userIds)
        .lte('start_date', endDate)
        .gte('end_date', startDate)
        .neq('id', editingEvent.id);

      if (existing && existing.length > 0) {
        setLoading(false);
        alert(`You already have a ${type === 'holiday' ? 'holiday' : 'remote work'} on these dates.`);
        return;
      }

      const { error } = await supabase
        .from('events')
        .update({
          user_ids: userIds,
          type,
          name: name.trim() || null,
          start_date: startDate,
          end_date: endDate,
          start_half_day: startHalfDay,
          end_half_day: endHalfDay,
        })
        .eq('id', editingEvent.id);

      setLoading(false);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      // Create: check overlap
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('type', type)
        .overlaps('user_ids', userIds)
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      if (existing && existing.length > 0) {
        setLoading(false);
        alert(`You already have a ${type === 'holiday' ? 'holiday' : 'remote work'} on these dates.`);
        return;
      }

      const { error } = await supabase.from('events').insert({
        user_ids: userIds,
        type,
        name: name.trim() || null,
        start_date: startDate,
        end_date: endDate,
        start_half_day: startHalfDay,
        end_half_day: endHalfDay,
        created_by: user.id,
      });
      setLoading(false);
      if (error) {
        alert(error.message);
        return;
      }
    }

    router.refresh();
    onSaved();
  }

  async function handleDelete() {
    if (!editingEvent) return;
    if (!confirm('Delete this event?')) return;
    setLoading(true);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', editingEvent.id);
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
    onSaved();
  }

  if (showEventPicker) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
        <div
          className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Edit event</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4 text-sm text-zinc-500">Which event would you like to edit?</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setSkipPicker(true);
                setType('holiday');
                setName('');
                setStartDate(format(initialDate, 'yyyy-MM-dd'));
                setEndDate(format(initialDate, 'yyyy-MM-dd'));
                setStartHalfDay(false);
                setEndHalfDay(false);
              }}
              className="w-full rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              + Add new event on this day
            </button>
            {dayEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setEditingEvent(ev)}
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <span className="font-medium">{ev.name || getEventTypeDisplayName(ev.type)}</span>
                {(ev.start_half_day || ev.end_half_day) && (
                  <span className="ml-2 text-zinc-500">
                    ({ev.start_date === ev.end_date
                      ? 'Half day'
                      : ev.start_half_day && ev.end_half_day
                        ? 'Start & end half'
                        : ev.start_half_day
                          ? 'Start half'
                          : 'End half'})
                  </span>
                )}
                <span className="ml-2 text-zinc-500">
                  {format(new Date(ev.start_date), 'd MMM')} – {format(new Date(ev.end_date), 'd MMM yyyy')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEditMode ? 'Edit event' : 'Add event'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setType('holiday')}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  type === 'holiday'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Holiday
              </button>
              <button
                type="button"
                onClick={() => setType('remote_work')}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  type === 'remote_work'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-950 dark:text-sky-300'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Remote work
              </button>
            </div>
          </div>
          {profiles.length === 2 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Who</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setForBoth(false)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    !forBoth ? 'border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  Just me
                </button>
                <button
                  type="button"
                  onClick={() => setForBoth(true)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    forBoth ? 'border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-300' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  Both of us
                </button>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer holiday"
              className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Start date
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="block flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100"
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={startHalfDay}
                  onChange={(e) => setStartHalfDay(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100"
                />
                Half day
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              End date
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
                className="block flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100"
              />
              {startDate !== endDate && (
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={endHalfDay}
                    onChange={(e) => setEndHalfDay(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100"
                  />
                  Half day
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-xl border border-red-200 px-4 py-2.5 font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
