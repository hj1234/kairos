import { createClient } from '@/lib/supabase/server';
import { calculateBalance } from '@/lib/balance';
import { getUserColor } from '@/lib/user-colors';

export async function BalanceCards() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .or(`id.eq.${user.id},partner_id.eq.${user.id},id.eq.(select partner_id from profiles where id.eq.${user.id})`);

  // Simpler: get own profile and partner's if exists
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const householdProfiles = myProfile ? [myProfile] : [];
  if (myProfile?.partner_id) {
    const { data: partner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', myProfile.partner_id)
      .single();
    if (partner) householdProfiles.push(partner);
  }

  const { data: events } = await supabase
    .from('events')
    .select('*');

  const sortedProfiles = [...householdProfiles].sort((a, b) =>
    a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase())
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sortedProfiles.map((profile) => {
        const {
          holidayBalance,
          wfaBalance,
          nextPeriodHolidayBalance,
          nextPeriodWfaBalance,
          showNextPeriodHoliday,
          showNextPeriodWfa,
        } = calculateBalance(profile, events || []);

        return (
          <div
            key={profile.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3
              className="font-medium"
              style={{ color: getUserColor(profile.id) }}
            >
              {profile.display_name}
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-zinc-500">Holiday:</span>{' '}
                <span className="font-medium">
                  {holidayBalance % 1 === 0 ? holidayBalance : holidayBalance.toFixed(1)} days left
                </span>
                {showNextPeriodHoliday && (
                  <span className="ml-1 text-zinc-500">
                    (next: {nextPeriodHolidayBalance % 1 === 0 ? nextPeriodHolidayBalance : nextPeriodHolidayBalance.toFixed(1)})
                  </span>
                )}
              </p>
              <p>
                <span className="text-zinc-500">Remote work:</span>{' '}
                <span className="font-medium">
                  {wfaBalance % 1 === 0 ? wfaBalance : wfaBalance.toFixed(1)} days left
                </span>
                {showNextPeriodWfa && (
                  <span className="ml-1 text-zinc-500">
                    (next: {nextPeriodWfaBalance % 1 === 0 ? nextPeriodWfaBalance : nextPeriodWfaBalance.toFixed(1)})
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
