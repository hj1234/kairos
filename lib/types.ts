export type EventType = 'holiday' | 'remote_work';

export function getEventTypeDisplayName(type: EventType): string {
  return type === 'remote_work' ? 'Remote work' : type;
}

export interface Profile {
  id: string;
  email?: string | null;
  display_name: string;
  partner_id?: string | null;
  holiday_allowance_days: number;
  remote_work_days: number;
  holiday_reset_day: number;
  holiday_reset_month: number;
  remote_work_reset_day: number;
  remote_work_reset_month: number;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  user_ids: string[];
  type: EventType;
  name?: string | null;
  start_half_day?: boolean;
  end_half_day?: boolean;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
}

export interface BankHoliday {
  title: string;
  date: string;
  notes?: string;
}
