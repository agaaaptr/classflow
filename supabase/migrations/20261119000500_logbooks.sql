-- Monthly logbooks (one per class per month) and their per-lesson entries.
-- Editing rules (draft-only) are enforced by RLS for clients; triggers enforce
-- data integrity (lesson belongs to the class and has ended) and the status
-- state machine.

create table public.logbooks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) default auth.uid(),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (class_id, period)
);

create table public.logbook_entries (
  id uuid primary key default gen_random_uuid(),
  logbook_id uuid not null references public.logbooks (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  topic text not null,
  activities text not null,
  observation text not null,
  recommendation text not null,
  created_at timestamptz not null default now(),
  unique (logbook_id, lesson_id)
);

alter table public.logbooks enable row level security;
alter table public.logbook_entries enable row level security;

-- Logbooks belong to the class's assigned tutor.
create or replace function public.set_logbook_tutor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select tutor_id into new.tutor_id from public.classes where id = new.class_id;
  if new.tutor_id is null then
    raise exception 'class not found';
  end if;
  return new;
end;
$$;

create trigger trg_logbook_set_tutor
  before insert on public.logbooks
  for each row execute function public.set_logbook_tutor();

-- An entry must reference a lesson of the same class that has already ended.
create or replace function public.validate_logbook_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class uuid;
  v_lesson_class uuid;
  v_ends timestamptz;
begin
  select class_id into v_class from public.logbooks where id = new.logbook_id;
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
  return new;
end;
$$;

create trigger trg_logbook_entry_validate
  before insert or update on public.logbook_entries
  for each row execute function public.validate_logbook_entry();

-- Status state machine: draft -> submitted (tutor, complete) -> approved
-- (admin). Approved is immutable.
create or replace function public.guard_logbook_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_missing int;
begin
  if old.status = 'approved' then
    raise exception 'approved logbook is read-only' using errcode = 'P0001';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if old.status = 'draft' and new.status = 'submitted' then
    if new.tutor_id <> auth.uid() and not private.is_admin() then
      raise exception 'only the tutor can submit' using errcode = '42501';
    end if;
    select count(*) into v_missing
      from public.lessons l
     where l.class_id = new.class_id
       and l.ends_at <= now()
       and to_char(l.ends_at at time zone 'Asia/Jakarta', 'YYYY-MM') = new.period
       and not exists (
         select 1 from public.logbook_entries e
          where e.logbook_id = new.id and e.lesson_id = l.id
       );
    if v_missing > 0 then
      raise exception 'logbook has % lesson(s) without an entry', v_missing using errcode = 'P0001';
    end if;
    return new;
  end if;
  if old.status = 'submitted' and new.status = 'approved' then
    if not private.is_admin() then
      raise exception 'only admins can approve' using errcode = '42501';
    end if;
    new.approved_at := coalesce(new.approved_at, now());
    new.approved_by := coalesce(new.approved_by, auth.uid());
    return new;
  end if;
  raise exception 'invalid logbook status transition % -> %', old.status, new.status using errcode = 'P0001';
end;
$$;

create trigger trg_logbook_status
  before update on public.logbooks
  for each row execute function public.guard_logbook_status();

create or replace function public.guard_logbook_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'approved' then
    raise exception 'approved logbook is read-only' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger trg_logbook_delete
  before delete on public.logbooks
  for each row execute function public.guard_logbook_delete();

create or replace function public.guard_entry_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status from public.logbooks where id = old.logbook_id;
  if v_status <> 'draft' then
    raise exception 'logbook is not editable' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger trg_entry_delete
  before delete on public.logbook_entries
  for each row execute function public.guard_entry_delete();

grant select on public.logbooks to authenticated;
grant insert (class_id, period, status) on public.logbooks to authenticated;
grant update (status) on public.logbooks to authenticated;
grant select, insert, update, delete on public.logbook_entries to authenticated;
grant all on public.logbooks, public.logbook_entries to service_role;

create policy logbooks_select on public.logbooks
  for select to authenticated
  using (
    private.is_admin()
    or tutor_id = auth.uid()
    or (status = 'approved' and private.student_has_paid(class_id))
  );

create policy logbooks_insert on public.logbooks
  for insert to authenticated
  with check (
    status = 'draft'
    and exists (
      select 1 from public.classes c
       where c.id = class_id and c.tutor_id = auth.uid()
    )
  );

create policy logbooks_update on public.logbooks
  for update to authenticated
  using (tutor_id = auth.uid())
  with check (tutor_id = auth.uid());

create policy entries_select on public.logbook_entries
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.logbooks b
       where b.id = logbook_id and b.tutor_id = auth.uid()
    )
    or exists (
      select 1 from public.logbooks b
       where b.id = logbook_id
         and b.status = 'approved'
         and private.student_has_paid(b.class_id)
    )
  );

create policy entries_insert on public.logbook_entries
  for insert to authenticated
  with check (
    exists (
      select 1 from public.logbooks b
       where b.id = logbook_id
         and b.tutor_id = auth.uid()
         and b.status = 'draft'
    )
  );

create policy entries_update on public.logbook_entries
  for update to authenticated
  using (
    exists (
      select 1 from public.logbooks b
       where b.id = logbook_id
         and b.tutor_id = auth.uid()
         and b.status = 'draft'
    )
  )
  with check (
    exists (
      select 1 from public.logbooks b
       where b.id = logbook_id
         and b.tutor_id = auth.uid()
         and b.status = 'draft'
    )
  );

create policy entries_delete on public.logbook_entries
  for delete to authenticated
  using (
    exists (
      select 1 from public.logbooks b
       where b.id = logbook_id
         and b.tutor_id = auth.uid()
         and b.status = 'draft'
    )
  );
