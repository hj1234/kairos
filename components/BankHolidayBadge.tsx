interface BankHolidayBadgeProps {
  className?: string;
}

export function BankHolidayBadge({ className = 'text-zinc-500' }: BankHolidayBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      UK bank holiday
    </span>
  );
}
