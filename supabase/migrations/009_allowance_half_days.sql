-- Allow holiday and remote work allowance to support half days (e.g. 25.5)
alter table public.profiles
  alter column holiday_allowance_days type numeric(5,1) using holiday_allowance_days::numeric(5,1),
  alter column remote_work_days type numeric(5,1) using remote_work_days::numeric(5,1);

alter table public.profiles
  add constraint holiday_allowance_non_negative check (holiday_allowance_days >= 0),
  add constraint remote_work_non_negative check (remote_work_days >= 0);
