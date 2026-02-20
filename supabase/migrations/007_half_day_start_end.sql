-- Replace half_day_period (morning/afternoon) with start/end half-day checkboxes
ALTER TABLE public.events DROP COLUMN IF EXISTS half_day_period;

ALTER TABLE public.events ADD COLUMN start_half_day boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN end_half_day boolean DEFAULT false;

-- Revert overlap trigger: any overlap = conflict (no morning/afternoon exception)
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
      CASE new.type WHEN 'holiday' THEN 'holiday' WHEN 'work_from_abroad' THEN 'work from abroad' END;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;
