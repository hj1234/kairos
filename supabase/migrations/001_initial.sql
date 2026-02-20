-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'User',
  partner_id uuid references public.profiles(id) on delete set null,
  holiday_allowance_days int not null default 25,
  work_from_abroad_days int not null default 0,
  holiday_reset_day int not null default 1 check (holiday_reset_day between 1 and 31),
  holiday_reset_month int not null default 1 check (holiday_reset_month between 1 and 12),
  wfa_reset_day int not null default 1 check (wfa_reset_day between 1 and 31),
  wfa_reset_month int not null default 1 check (wfa_reset_month between 1 and 12),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Allow partner_id self-reference
alter table public.profiles add constraint no_self_partner check (partner_id is null or partner_id != id);

-- Events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_ids uuid[] not null,
  type text not null check (type in ('holiday', 'work_from_abroad')),
  start_date date not null,
  end_date date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  constraint valid_date_range check (end_date >= start_date)
);

-- RLS: profiles
alter table public.profiles enable row level security;

-- Can view own profile or partner's profile (for balance display)
create policy "Users can view own or partner profile"
  on public.profiles for select
  using (
    auth.uid() = id
    or partner_id = auth.uid()
    or id = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS: events
alter table public.events enable row level security;

-- Users can read events where they are in user_ids
create policy "Users can view own events"
  on public.events for select
  using (auth.uid() = any(user_ids));

-- Users can insert events if they include themselves
create policy "Users can create events"
  on public.events for insert
  with check (auth.uid() = any(user_ids));

-- Users can update/delete events they are part of
create policy "Users can update own events"
  on public.events for update
  using (auth.uid() = any(user_ids));

create policy "Users can delete own events"
  on public.events for delete
  using (auth.uid() = any(user_ids));

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', 'User'));
  return new;
end;
$$ language plpgsql security definer;

-- RPC to link partner by email (both users must exist; creates bidirectional link)
create or replace function public.link_partner(partner_email text)
returns void as $$
declare
  partner_uuid uuid;
  my_id uuid := auth.uid();
begin
  select id into partner_uuid from auth.users where email = lower(trim(partner_email));
  if partner_uuid is null then
    raise exception 'No user found with that email';
  end if;
  if partner_uuid = my_id then
    raise exception 'Cannot link to yourself';
  end if;
  update public.profiles set partner_id = partner_uuid where id = my_id;
  update public.profiles set partner_id = my_id where id = partner_uuid;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger for profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
