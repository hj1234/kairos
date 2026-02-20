import type { BankHoliday } from './types';

const GOV_UK_URL = 'https://www.gov.uk/bank-holidays.json';
const DIVISION = 'england-and-wales';

let cached: BankHoliday[] | null = null;

export async function fetchBankHolidays(): Promise<BankHoliday[]> {
  if (cached) return cached;
  const res = await fetch(GOV_UK_URL);
  const data = (await res.json()) as Record<string, { events: Array<{ title: string; date: string; notes?: string }> }>;
  const division = data[DIVISION];
  if (!division) throw new Error('Bank holidays data not found');
  cached = division.events.map((e) => ({
    title: e.title,
    date: e.date,
    notes: e.notes,
  }));
  return cached;
}

export function getBankHolidaysForDateRange(
  holidays: BankHoliday[],
  start: Date,
  end: Date
): BankHoliday[] {
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return holidays.filter((h) => h.date >= startStr && h.date <= endStr);
}
