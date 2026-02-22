import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchBankHolidays } from '@/lib/bank-holidays';
import { CalendarPreview } from '@/components/CalendarPreview';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/app');
  }

  let bankHolidays: Awaited<ReturnType<typeof fetchBankHolidays>> = [];
  try {
    bankHolidays = await fetchBankHolidays();
  } catch {
    // Use empty array if fetch fails (e.g. offline)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
            Kairos
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Holiday planning for couples
          </p>
        </header>

        <section className="mt-10 space-y-6 text-center md:mt-16">
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            Plan holidays and remote work together. See your 24‑month calendar with UK bank holidays,
            track allowance, and keep your balance in sync with your partner.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mt-16 md:mt-24">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-100/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Calendar preview
              </p>
            </div>
            <div className="p-4 md:p-6">
              <CalendarPreview bankHolidays={bankHolidays} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
