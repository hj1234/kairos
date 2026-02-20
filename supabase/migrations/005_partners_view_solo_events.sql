-- Allow partners to see each other's solo events (shared calendar)
drop policy if exists "Users can view own events" on public.events;

create policy "Users can view own and partner events"
  on public.events for select
  using (
    auth.uid() = any(user_ids)
    or (
      (select partner_id from public.profiles where id = auth.uid()) is not null
      and (select partner_id from public.profiles where id = auth.uid()) = any(user_ids)
    )
  );
