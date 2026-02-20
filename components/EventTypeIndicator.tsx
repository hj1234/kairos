import { getUserColor } from '@/lib/user-colors';
import type { Event } from '@/lib/types';

interface EventTypeIndicatorProps {
  event: Event;
  className?: string;
  profileMap?: Map<string, string>;
}

export function EventTypeIndicator({ event, className = '', profileMap }: EventTypeIndicatorProps) {
  const isHoliday = event.type === 'holiday';
  const isShared = event.user_ids.length === 2;

  const sortedUserIds = isShared && profileMap
    ? [...event.user_ids].sort((a, b) => {
        const nameA = (profileMap.get(a) ?? '').toLowerCase();
        const nameB = (profileMap.get(b) ?? '').toLowerCase();
        return nameA.localeCompare(nameB);
      })
    : event.user_ids;

  if (isShared) {
    const color1 = getUserColor(sortedUserIds[0]);
    const color2 = getUserColor(sortedUserIds[1]);
    const gradient = `conic-gradient(${color1} 0deg 180deg, ${color2} 180deg 360deg)`;
    if (isHoliday) {
      return (
        <span
          className={`h-3 w-3 shrink-0 rounded-sm ${className}`}
          style={{ background: gradient }}
        />
      );
    }
    return (
      <span
        className={`block h-3 w-3 shrink-0 rounded-sm p-[2px] ${className}`}
        style={{ background: gradient }}
      >
        <span className="block h-full w-full rounded-[2px] bg-white dark:bg-zinc-900" />
      </span>
    );
  }

  const color = getUserColor(event.user_ids[0]);
  return (
    <span
      className={`h-3 w-3 shrink-0 rounded-sm ${isHoliday ? '' : 'border bg-transparent'} ${className}`}
      style={{
        ...(isHoliday ? { backgroundColor: color } : { borderColor: color }),
      }}
    />
  );
}
