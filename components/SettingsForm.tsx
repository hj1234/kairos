'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

interface SettingsFormProps {
  profile: Profile;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function SettingsForm({ profile }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [holidayAllowance, setHolidayAllowance] = useState(profile.holiday_allowance_days);
  const [wfaAllowance, setWfaAllowance] = useState(profile.work_from_abroad_days);
  const [holidayResetDay, setHolidayResetDay] = useState(profile.holiday_reset_day);
  const [holidayResetMonth, setHolidayResetMonth] = useState(profile.holiday_reset_month);
  const [wfaResetDay, setWfaResetDay] = useState(profile.wfa_reset_day);
  const [wfaResetMonth, setWfaResetMonth] = useState(profile.wfa_reset_month);
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
      .update({
        display_name: displayName,
        holiday_allowance_days: holidayAllowance,
        work_from_abroad_days: wfaAllowance,
        holiday_reset_day: holidayResetDay,
        holiday_reset_month: holidayResetMonth,
        wfa_reset_day: wfaResetDay,
        wfa_reset_month: wfaResetMonth,
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

  return (
    <div className="space-y-8">
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <h2 className="text-lg font-medium">Your profile</h2>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="holidayAllowance" className="block text-sm font-medium text-zinc-700">
            Holiday allowance (days per year)
          </label>
          <input
            id="holidayAllowance"
            type="number"
            min={0}
            max={365}
            value={holidayAllowance}
            onChange={(e) => setHolidayAllowance(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="holidayReset" className="block text-sm font-medium text-zinc-700">
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
        <div>
          <label htmlFor="wfaAllowance" className="block text-sm font-medium text-zinc-700">
            Work from abroad allowance (days per year)
          </label>
          <input
            id="wfaAllowance"
            type="number"
            min={0}
            max={365}
            value={wfaAllowance}
            onChange={(e) => setWfaAllowance(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="wfaReset" className="block text-sm font-medium text-zinc-700">
            Work from abroad reset date
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
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      {!profile.partner_id && (
        <form onSubmit={handleLinkPartner} className="space-y-4">
          <h2 className="text-lg font-medium">Link partner</h2>
          <p className="text-sm text-zinc-500">
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
              className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {linkStatus === 'loading' ? 'Linking...' : 'Link'}
            </button>
          </div>
          {linkMessage && (
            <p className={`text-sm ${linkStatus === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {linkMessage}
            </p>
          )}
        </form>
      )}

      {profile.partner_id && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Partner linked
          </p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            You can now create events together and see each other&apos;s balances.
          </p>
        </div>
      )}
    </div>
  );
}
