import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Kairos
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Calendar
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Settings
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="pb-safe">{children}</main>
    </div>
  );
}
