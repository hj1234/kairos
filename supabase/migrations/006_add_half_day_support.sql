-- Add optional half day period (morning or afternoon)
alter table public.events add column half_day_period text check (
  half_day_period is null or half_day_period in ('morning', 'afternoon')
);

-- Update overlap trigger: morning and afternoon on same day don't conflict
create or replace function public.check_no_overlapping_events()
returns trigger as $$
declare
  e record;
  d date;
  conflict boolean;
begin
  for e in
    select * from public.events
    where id is distinct from new.id
    and type = new.type
    and user_ids && new.user_ids
    and start_date <= new.end_date
    and end_date >= new.start_date
  loop
    for d in
      select gs::date from generate_series(
        greatest(new.start_date, e.start_date)::date,
        least(new.end_date, e.end_date)::date,
        '1 day'::interval
      ) gs
    loop
      conflict :=
        new.half_day_period is null
        or e.half_day_period is null
        or new.half_day_period = e.half_day_period;
      if conflict then
        raise exception 'You already have a % on these dates',
          case new.type when 'holiday' then 'holiday' when 'work_from_abroad' then 'work from abroad' end;
      end if;
    end loop;
  end loop;
  return new;
end;
$$ language plpgsql;
