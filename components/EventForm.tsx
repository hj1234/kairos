'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { EventType, Event, HalfDayPeriod } from '@/lib/types';

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
  const [halfDayPeriod, setHalfDayPeriod] = useState<HalfDayPeriod | null>(null);
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
      setHalfDayPeriod(editingEvent.half_day_period ?? null);
      setForBoth(editingEvent.user_ids.length > 1);
    } else if (dayEvents.length === 0) {
      setType('holiday');
      setStartDate(format(initialDate, 'yyyy-MM-dd'));
      setEndDate(format(initialDate, 'yyyy-MM-dd'));
      setHalfDayPeriod(null);
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
      // Update: check overlap excluding current event (morning + afternoon allowed)
      const { data: existing } = await supabase
        .from('events')
        .select('id, half_day_period')
        .eq('type', type)
        .overlaps('user_ids', userIds)
        .lte('start_date', endDate)
        .gte('end_date', startDate)
        .neq('id', editingEvent.id);

      const conflicting = (existing ?? []).filter((ev) => {
        const ex = ev.half_day_period ?? null;
        const ours = halfDayPeriod;
        if (ex === null || ours === null) return true; // full day conflicts with all
        if (ex === ours) return true; // same period conflicts
        return false; // morning vs afternoon: no conflict
      });

      if (conflicting.length > 0) {
        setLoading(false);
        alert(`You already have a ${type === 'holiday' ? 'holiday' : 'work from abroad'} on these dates.`);
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
          half_day_period: halfDayPeriod,
        })
        .eq('id', editingEvent.id);

      setLoading(false);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      // Create: check overlap (morning + afternoon allowed)
      const { data: existing } = await supabase
        .from('events')
        .select('id, half_day_period')
        .eq('type', type)
        .overlaps('user_ids', userIds)
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      const conflicting = (existing ?? []).filter((ev) => {
        const ex = ev.half_day_period ?? null;
        const ours = halfDayPeriod;
        if (ex === null || ours === null) return true; // full day conflicts with all
        if (ex === ours) return true; // same period conflicts
        return false; // morning vs afternoon: no conflict
      });

      if (conflicting.length > 0) {
        setLoading(false);
        alert(`You already have a ${type === 'holiday' ? 'holiday' : 'work from abroad'} on these dates.`);
        return;
      }

      const { error } = await supabase.from('events').insert({
        user_ids: userIds,
        type,
        name: name.trim() || null,
        start_date: startDate,
        end_date: endDate,
        half_day_period: halfDayPeriod,
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
                setHalfDayPeriod(null);
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
                <span className="font-medium">{ev.name || ev.type.replace('_', ' ')}</span>
                {ev.half_day_period && (
                  <span className="ml-2 text-zinc-500">({ev.half_day_period})</span>
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
            <label className="block text-sm font-medium text-zinc-700">Type</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setType('holiday')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  type === 'holiday'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Holiday
              </button>
              <button
                type="button"
                onClick={() => setType('work_from_abroad')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  type === 'work_from_abroad'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Work from abroad
              </button>
            </div>
          </div>
          {profiles.length === 2 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">Who</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setForBoth(false)}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
                    !forBoth ? 'border-zinc-900 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  Just me
                </button>
                <button
                  type="button"
                  onClick={() => setForBoth(true)}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
                    forBoth ? 'border-amber-500 bg-amber-50 dark:bg-amber-950' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  Both of us
                </button>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer holiday"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Day period</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setHalfDayPeriod(null)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
                  halfDayPeriod === null ? 'border-zinc-900 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Full day
              </button>
              <button
                type="button"
                onClick={() => setHalfDayPeriod('morning')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
                  halfDayPeriod === 'morning' ? 'border-zinc-900 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Morning
              </button>
              <button
                type="button"
                onClick={() => setHalfDayPeriod('afternoon')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
                  halfDayPeriod === 'afternoon' ? 'border-zinc-900 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Afternoon
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700"
            >
              Cancel
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
