-- Fix infinite recursion in profiles select policy
-- The subquery (select partner_id from profiles where id = auth.uid()) caused
-- recursion. The condition "partner_id = auth.uid()" already covers reading
-- our partner's profile (their row has partner_id = us).

drop policy if exists "Users can view own or partner profile" on public.profiles;

create policy "Users can view own or partner profile"
  on public.profiles for select
  using (
    auth.uid() = id
    or partner_id = auth.uid()
  );
