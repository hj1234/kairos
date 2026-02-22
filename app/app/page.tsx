import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventsSection } from '@/components/EventsSection';
import { BalanceCards } from '@/components/BalanceCard';
import { fetchBankHolidays } from '@/lib/bank-holidays';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, display_name, partner_id')
    .eq('id', user.id)
    .single();

  const profiles: { id: string; display_name: string }[] = myProfile
    ? [{ id: myProfile.id, display_name: myProfile.display_name }]
    : [];
  if (myProfile?.partner_id) {
    const { data: partner } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', myProfile.partner_id)
      .single();
    if (partner) profiles.push(partner);
  }

  const [bankHolidays, { data: events }] = await Promise.all([
    fetchBankHolidays(),
    supabase.from('events').select('*'),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:min-h-0 md:flex-1 md:flex">
      <div className="min-h-0 shrink-0 md:flex md:min-h-0 md:flex-1 md:flex-col">
        <EventsSection
          bankHolidays={bankHolidays}
          events={events || []}
          profiles={profiles}
        />
      </div>
      <div className="shrink-0">
        <BalanceCards />
      </div>
    </div>
  );
}
