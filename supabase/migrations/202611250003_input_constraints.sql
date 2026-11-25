-- The browser writes these tables directly, so API validation alone is insufficient.
-- Existing rows were checked before applying these constraints.
begin;
alter table public.beehive_details
  add constraint beegarden_valid_details check (
    (swarms is null or swarms between 0 and 100000)
    and (breed is null or length(breed) <= 200)
    and (custom_note is null or length(custom_note) <= 10000)
  );
alter table public.tasks
  add constraint beegarden_valid_task_text check (length(btrim(task_text)) between 1 and 10000);
alter table public.honey_pumpings
  add constraint beegarden_finite_positive_volume check (volume_liters > 0 and volume_liters < 'Infinity'::numeric);
commit;
