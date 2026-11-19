-- Compliance hardening: close two gaps found in the brief re-scan.

-- 1. A tutor must never be able to derive the student rate. enrollments.amount_rp
--    = package_minutes * student_rate, so exposing it to tutors leaks the rate
--    (amount / hours). Restrict client reads to non-financial columns.
revoke select on public.enrollments from authenticated;
grant select (id, class_id, student_id, package_minutes, status, created_at)
  on public.enrollments to authenticated;

-- 2. A logbook entry must belong to the logbook's period: the lesson's WIB month
--    must equal the logbook period, not just the same class.
create or replace function public.validate_logbook_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class uuid;
  v_period text;
  v_lesson_class uuid;
  v_ends timestamptz;
begin
  select class_id, period into v_class, v_period from public.logbooks where id = new.logbook_id;
  if v_class is null then
    raise exception 'logbook not found';
  end if;
  select class_id, ends_at into v_lesson_class, v_ends from public.lessons where id = new.lesson_id;
  if v_lesson_class is null then
    raise exception 'lesson not found';
  end if;
  if v_lesson_class <> v_class then
    raise exception 'lesson does not belong to this class';
  end if;
  if v_ends > now() then
    raise exception 'lesson has not ended yet' using errcode = 'P0001';
  end if;
  if to_char(v_ends at time zone 'Asia/Jakarta', 'YYYY-MM') <> v_period then
    raise exception 'lesson is outside this logbook period' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
