import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Create profile if missing (e.g. user signed up before migration ran)
  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email ?? null,
        display_name: user.user_metadata?.display_name ?? 'User',
      })
      .select()
      .single();

    if (error) {
      // Duplicate key = profile was created by trigger, retry select
      if (error.code === '23505') {
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        profile = retryProfile ?? undefined;
      }
      if (!profile) {
        return (
          <div className="p-4">
            <h1 className="mb-6 text-xl font-semibold">Settings</h1>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="font-medium text-red-800 dark:text-red-200">
                Could not load settings
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error.message}
              </p>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Make sure you have run the database migration in Supabase. If you
                already have, try signing out and back in.
              </p>
            </div>
          </div>
        );
      }
    } else {
      profile = newProfile;
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <SettingsForm profile={profile} />
    </div>
  );
}
