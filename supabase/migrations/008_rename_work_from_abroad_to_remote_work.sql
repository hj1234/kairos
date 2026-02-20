-- Rename "work from abroad" to "remote work" in the database

-- 1. Update existing events: work_from_abroad -> remote_work
UPDATE public.events SET type = 'remote_work' WHERE type = 'work_from_abroad';

-- 2. Drop old check constraint and add new one on events.type
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check CHECK (type IN ('holiday', 'remote_work'));

-- 3. Rename profile columns
ALTER TABLE public.profiles RENAME COLUMN work_from_abroad_days TO remote_work_days;
ALTER TABLE public.profiles RENAME COLUMN wfa_reset_day TO remote_work_reset_day;
ALTER TABLE public.profiles RENAME COLUMN wfa_reset_month TO remote_work_reset_month;

-- 4. Update overlap trigger error message
CREATE OR REPLACE FUNCTION public.check_no_overlapping_events()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id IS DISTINCT FROM new.id
    AND e.type = new.type
    AND e.user_ids && new.user_ids
    AND e.start_date <= new.end_date
    AND e.end_date >= new.start_date
  ) THEN
    RAISE EXCEPTION 'You already have a % on these dates',
      CASE new.type WHEN 'holiday' THEN 'holiday' WHEN 'remote_work' THEN 'remote work' END;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;
