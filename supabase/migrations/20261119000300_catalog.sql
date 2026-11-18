-- Classes, admin-only rates, and lessons with a race-free no-overlap constraint.

set search_path = public, extensions;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tutor_id uuid not null references public.profiles (id),
  capacity int not null check (capacity > 0),
  package_minutes int not null check (package_minutes > 0),
  created_at timestamptz not null default now()
);

-- Financial rates live in their own admin-only table so a tutor can never read
-- a student rate (RLS hides the rows; the enroll/approve RPCs read them as the
-- definer).
create table public.class_rates (
  class_id uuid primary key references public.classes (id) on delete cascade,
  student_rate_rp bigint not null check (student_rate_rp >= 0),
  tutor_rate_rp bigint not null check (tutor_rate_rp >= 0)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint lessons_ends_after_starts check (ends_at > starts_at),
  -- Half-open [) bounds are the default of the two-argument tstzrange, so
  -- back-to-back lessons do not collide. Never build this range as [].
  constraint lessons_tutor_no_overlap exclude using gist (
    tutor_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
);

create index lessons_tutor_starts_idx on public.lessons (tutor_id, starts_at);
create index lessons_class_starts_idx on public.lessons (class_id, starts_at);

alter table public.classes enable row level security;
alter table public.class_rates enable row level security;
alter table public.lessons enable row level security;

-- Class catalog is safe for every signed-in user; writes go through create_class().
grant select on public.classes to authenticated;
grant all on public.classes to service_role;
create policy classes_select on public.classes
  for select to authenticated
  using (true);

-- Rates are admin-only.
grant select on public.class_rates to authenticated;
grant all on public.class_rates to service_role;
create policy class_rates_admin on public.class_rates
  for select to authenticated
  using (private.is_admin());

-- Lessons are readable by admins, the assigned tutor, and paid students. The
-- paid-student policy is added in the enrollment migration (it needs
-- student_has_paid()).
grant select on public.lessons to authenticated;
grant all on public.lessons to service_role;

create or replace function public.create_class(
  p_name text,
  p_tutor_id uuid,
  p_student_rate_rp bigint,
  p_tutor_rate_rp bigint,
  p_capacity int,
  p_package_minutes int
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'only admins can create classes' using errcode = '42501';
  end if;
  insert into public.classes (name, tutor_id, capacity, package_minutes)
    values (p_name, p_tutor_id, p_capacity, p_package_minutes)
    returning id into v_id;
  insert into public.class_rates (class_id, student_rate_rp, tutor_rate_rp)
    values (v_id, p_student_rate_rp, p_tutor_rate_rp);
  return v_id;
end;
$$;

create or replace function public.schedule_lesson(
  p_class_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tutor uuid;
  v_id uuid;
begin
  select tutor_id into v_tutor from public.classes where id = p_class_id;
  if v_tutor is null then
    raise exception 'class not found';
  end if;
  if not (private.is_admin() or v_tutor = auth.uid()) then
    raise exception 'only the assigned tutor or an admin can schedule' using errcode = '42501';
  end if;
  if p_ends_at <= p_starts_at then
    raise exception 'end must be after start' using errcode = '22007';
  end if;
  insert into public.lessons (class_id, tutor_id, starts_at, ends_at)
    values (p_class_id, v_tutor, p_starts_at, p_ends_at)
    returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_class(text, uuid, bigint, bigint, int, int) from public, anon;
revoke all on function public.schedule_lesson(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.create_class(text, uuid, bigint, bigint, int, int) to authenticated, service_role;
grant execute on function public.schedule_lesson(uuid, timestamptz, timestamptz) to authenticated, service_role;
