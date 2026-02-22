'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getUserColor } from '@/lib/user-colors';
import type { Profile } from '@/lib/types';

interface SettingsFormProps {
  profile: Profile;
  partner?: { id: string; display_name: string } | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse allowance input: must be integer or integer + 0.5 (e.g. 25 or 25.5). Returns null if invalid. */
function parseAllowanceDays(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return null;
  const intPart = Math.floor(num);
  const fracPart = num - intPart;
  if (fracPart < 0.01) return intPart;
  if (fracPart >= 0.49 && fracPart <= 0.51) return intPart + 0.5;
  return null;
}

function formatAllowanceDays(value: number): string {
  return value % 1 === 0 ? String(value) : String(value);
}

type SettingsSection = 'profile' | 'holidays' | 'remote_work' | 'partner';

const SECTION_LABELS: Record<SettingsSection, string> = {
  profile: 'Profile',
  holidays: 'Holidays',
  remote_work: 'Remote work',
  partner: 'Partner',
};

export function SettingsForm({ profile, partner }: SettingsFormProps) {
  const [section, setSection] = useState<SettingsSection>('profile');
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [holidayAllowance, setHolidayAllowance] = useState(
    formatAllowanceDays(profile.holiday_allowance_days)
  );
  const [wfaAllowance, setWfaAllowance] = useState(
    formatAllowanceDays(profile.remote_work_days)
  );
  const [holidayResetDay, setHolidayResetDay] = useState(profile.holiday_reset_day);
  const [holidayResetMonth, setHolidayResetMonth] = useState(profile.holiday_reset_month);
  const [wfaResetDay, setWfaResetDay] = useState(profile.remote_work_reset_day);
  const [wfaResetMonth, setWfaResetMonth] = useState(profile.remote_work_reset_month);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [linkMessage, setLinkMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  async function handleSaveHolidays(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseAllowanceDays(holidayAllowance);
    if (parsed === null) {
      alert('Holiday allowance must be a whole number or half day (e.g. 25 or 25.5).');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        holiday_allowance_days: parsed,
        holiday_reset_day: holidayResetDay,
        holiday_reset_month: holidayResetMonth,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  async function handleSaveRemoteWork(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseAllowanceDays(wfaAllowance);
    if (parsed === null) {
      alert('Remote work allowance must be a whole number or half day (e.g. 10 or 10.5).');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        remote_work_days: parsed,
        remote_work_reset_day: wfaResetDay,
        remote_work_reset_month: wfaResetMonth,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  async function handleLinkPartner(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerEmail.trim()) return;
    setLinkStatus('loading');
    setLinkMessage('');
    const { error } = await supabase.rpc('link_partner', {
      partner_email: partnerEmail.trim(),
    });
    if (error) {
      setLinkStatus('error');
      setLinkMessage(error.message);
      return;
    }
    setLinkStatus('success');
    setLinkMessage('Partner linked successfully');
    setPartnerEmail('');
    router.refresh();
  }

  const navButtonClass = (s: SettingsSection) =>
    `w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
      section === s
        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
    }`;

  const inputClass =
    'mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800';
  const labelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
  const saveButtonClass =
    'rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900';

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <nav
        className="flex shrink-0 flex-row flex-wrap gap-1 md:flex-col md:flex-nowrap"
        aria-label="Settings sections"
      >
        {(Object.keys(SECTION_LABELS) as SettingsSection[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={navButtonClass(s)}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        {section === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h2 className="text-lg font-medium">Profile</h2>
            <div>
              <label htmlFor="displayName" className={labelClass}>
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={saving} className={saveButtonClass}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {section === 'holidays' && (
          <form onSubmit={handleSaveHolidays} className="space-y-6">
            <h2 className="text-lg font-medium">Holidays</h2>
            <div>
              <label htmlFor="holidayAllowance" className={labelClass}>
                Holiday allowance (days per year)
              </label>
              <input
                id="holidayAllowance"
                type="text"
                inputMode="decimal"
                value={holidayAllowance}
                onChange={(e) => setHolidayAllowance(e.target.value)}
                placeholder="e.g. 25 or 25.5"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Whole number or half day (e.g. 25 or 25.5)
              </p>
            </div>
            <div>
              <label htmlFor="holidayReset" className={labelClass}>
                Holiday reset date
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={holidayResetDay}
                  onChange={(e) => setHolidayResetDay(Number(e.target.value))}
                  className="w-20 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <select
                  value={holidayResetMonth}
                  onChange={(e) => setHolidayResetMonth(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className={saveButtonClass}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {section === 'remote_work' && (
          <form onSubmit={handleSaveRemoteWork} className="space-y-6">
            <h2 className="text-lg font-medium">Remote work</h2>
            <div>
              <label htmlFor="wfaAllowance" className={labelClass}>
                Remote work allowance (days per year)
              </label>
              <input
                id="wfaAllowance"
                type="text"
                inputMode="decimal"
                value={wfaAllowance}
                onChange={(e) => setWfaAllowance(e.target.value)}
                placeholder="e.g. 10 or 10.5"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Whole number or half day (e.g. 10 or 10.5)
              </p>
            </div>
            <div>
              <label htmlFor="wfaReset" className={labelClass}>
                Remote work reset date
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={wfaResetDay}
                  onChange={(e) => setWfaResetDay(Number(e.target.value))}
                  className="w-20 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <select
                  value={wfaResetMonth}
                  onChange={(e) => setWfaResetMonth(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className={saveButtonClass}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {section === 'partner' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Partner</h2>
            {!profile.partner_id ? (
              <form onSubmit={handleLinkPartner} className="space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Enter your partner&apos;s email to link accounts. They must have signed up first.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    type="submit"
                    disabled={linkStatus === 'loading'}
                    className={saveButtonClass}
                  >
                    {linkStatus === 'loading' ? 'Linking...' : 'Link'}
                  </button>
                </div>
                {linkMessage && (
                  <p className={`text-sm ${linkStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {linkMessage}
                  </p>
                )}
              </form>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Linked with{' '}
                  <span
                    className="font-medium"
                    style={{ color: partner ? getUserColor(partner.id) : undefined }}
                  >
                    {partner?.display_name ?? 'your partner'}
                  </span>
                </p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  You can now create events together and see each other&apos;s balances.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
