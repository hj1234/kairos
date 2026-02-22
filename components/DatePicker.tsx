'use client';

import { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
} from 'date-fns';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
}

const POPOVER_HEIGHT_ESTIMATE = 320;

export function DatePicker({ id, value, onChange, min, max, className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [positionAbove, setPositionAbove] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(value) : new Date()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;

  useEffect(() => {
    if (value) setViewMonth(new Date(value));
  }, [value]);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPositionAbove(spaceBelow < POPOVER_HEIGHT_ESTIMATE && spaceAbove > spaceBelow);
    }
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = new Date(calendarStart);
  while (day <= calendarEnd) {
    days.push(new Date(day));
    day = addDays(day, 1);
  }

  const isDisabled = (d: Date) => {
    if (minDate && isBefore(d, minDate)) return true;
    if (maxDate && isAfter(d, maxDate)) return true;
    return false;
  };

  const handleSelect = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayValue = value ? format(new Date(value), 'd MMM yyyy') : '';

  const baseInputClass =
    'block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100';
  const dayBtnClass =
    'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => {
          updatePosition();
          setOpen((o) => !o);
        }}
        className={`${baseInputClass} w-full cursor-pointer text-left`}
      >
        <span className={value ? '' : 'text-zinc-500 dark:text-zinc-400'}>
          {displayValue || 'Select date'}
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className={`absolute left-0 z-50 min-w-[280px] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 ${
            positionAbove ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                {d}
              </div>
            ))}
            {days.map((d) => {
              const dateStr = format(d, 'yyyy-MM-dd');
              const inMonth = isSameMonth(d, viewMonth);
              const selected = value === dateStr;
              const today = isSameDay(d, new Date());
              const disabled = isDisabled(d);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelect(d)}
                  disabled={disabled}
                  className={`${dayBtnClass} ${
                    disabled
                      ? 'cursor-not-allowed text-zinc-300 dark:text-zinc-600'
                      : selected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : today
                          ? 'ring-2 ring-zinc-900 dark:ring-zinc-100'
                          : inMonth
                            ? 'text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700'
                            : 'text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-700'
                  }`}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
