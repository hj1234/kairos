-- Prevent overlapping events of the same type for the same user(s)
create or replace function public.check_no_overlapping_events()
returns trigger as $$
begin
  if exists (
    select 1 from public.events e
    where e.id is distinct from new.id
    and e.type = new.type
    and e.user_ids && new.user_ids
    and e.start_date <= new.end_date
    and e.end_date >= new.start_date
  ) then
    raise exception 'You already have a % on these dates', 
      case new.type when 'holiday' then 'holiday' when 'work_from_abroad' then 'work from abroad' end;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger no_overlapping_events
  before insert or update on public.events
  for each row execute procedure public.check_no_overlapping_events();
