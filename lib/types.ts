export type EventType = 'holiday' | 'work_from_abroad';

export interface Profile {
  id: string;
  email?: string | null;
  display_name: string;
  partner_id?: string | null;
  holiday_allowance_days: number;
  work_from_abroad_days: number;
  holiday_reset_day: number;
  holiday_reset_month: number;
  wfa_reset_day: number;
  wfa_reset_month: number;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  user_ids: string[];
  type: EventType;
  name?: string | null;
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
