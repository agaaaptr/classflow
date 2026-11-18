-- Enrollments (active/cancelled), invoices (unpaid/paid/cancelled), and the
-- capacity trigger. Writes flow through enroll_student / pay_invoice /
-- cancel_invoice; clients get read-only grants.

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id),
  package_minutes int not null check (package_minutes > 0),
  amount_rp bigint not null check (amount_rp >= 0),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Partial unique index: a cancelled enrollment does not block re-enrollment.
create unique index enrollments_active_unique
  on public.enrollments (class_id, student_id)
  where status = 'active';
create index enrollments_student_idx on public.enrollments (student_id);
create index enrollments_class_idx on public.enrollments (class_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  student_id uuid not null references public.profiles (id),
  amount_rp bigint not null check (amount_rp >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'cancelled')),
  paid_at timestamptz,
  paid_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint invoices_paid_fields check (
    (status = 'paid' and paid_at is not null) or status <> 'paid'
  ),
  constraint invoices_cancelled_fields check (
    (status = 'cancelled' and cancelled_at is not null) or status <> 'cancelled'
  )
);

create unique index invoices_enrollment_unique on public.invoices (enrollment_id);

alter table public.enrollments enable row level security;
alter table public.invoices enable row level security;

-- Race-free capacity: lock the class row, then count active enrollments.
create or replace function public.enforce_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity int;
  v_count int;
begin
  if new.status <> 'active' then
    return new;
  end if;
  select capacity into v_capacity
    from public.classes
   where id = new.class_id
   for update;
  if v_capacity is null then
    raise exception 'class not found';
  end if;
  select count(*) into v_count
    from public.enrollments
   where class_id = new.class_id
     and status = 'active';
  if v_count >= v_capacity then
    raise exception 'class is full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_enrollment_capacity
  before insert on public.enrollments
  for each row execute function public.enforce_capacity();

-- Paid access for a student in a class (drives the "students see only classes
-- they have paid for" RLS rules).
create or replace function private.student_has_paid(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.enrollments e
      join public.invoices i on i.enrollment_id = e.id
     where e.class_id = p_class_id
       and e.student_id = auth.uid()
       and e.status = 'active'
       and i.status = 'paid'
  )
$$;

revoke all on function private.student_has_paid(uuid) from public, anon;
grant execute on function private.student_has_paid(uuid) to authenticated, service_role;

-- Lesson visibility depends on paid access, so it is created here.
create policy lessons_select on public.lessons
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.classes c
       where c.id = lessons.class_id
         and c.tutor_id = auth.uid()
    )
    or private.student_has_paid(lessons.class_id)
  );

grant select on public.enrollments to authenticated;
grant select on public.invoices to authenticated;
grant all on public.enrollments, public.invoices to service_role;

create policy enrollments_select on public.enrollments
  for select to authenticated
  using (
    private.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.classes c
       where c.id = enrollments.class_id
         and c.tutor_id = auth.uid()
    )
  );

create policy invoices_select on public.invoices
  for select to authenticated
  using (private.is_admin() or student_id = auth.uid());

-- A student enrolls themselves. The invoice amount is computed server-side
-- from the class package and the (hidden) student rate.
create or replace function public.enroll_student(p_class_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_package int;
  v_rate bigint;
  v_amount bigint;
  v_enrollment uuid;
  v_invoice uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if private.get_user_role() <> 'student' then
    raise exception 'only students can enroll' using errcode = '42501';
  end if;
  select package_minutes into v_package from public.classes where id = p_class_id;
  if v_package is null then
    raise exception 'class not found';
  end if;
  select student_rate_rp into v_rate from public.class_rates where class_id = p_class_id;
  if v_rate is null then
    raise exception 'class has no rate';
  end if;
  v_amount := round((v_package::numeric / 60) * v_rate)::bigint;
  insert into public.enrollments (class_id, student_id, package_minutes, amount_rp, status)
    values (p_class_id, v_uid, v_package, v_amount, 'active')
    returning id into v_enrollment;
  insert into public.invoices (enrollment_id, student_id, amount_rp, status)
    values (v_enrollment, v_uid, v_amount, 'unpaid')
    returning id into v_invoice;
  return v_invoice;
end;
$$;

-- Simulated payment: the student marks their own unpaid invoice as paid.
create or replace function public.pay_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student uuid;
  v_status text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select student_id, status into v_student, v_status
    from public.invoices
   where id = p_invoice_id
   for update;
  if v_student is null then
    raise exception 'invoice not found';
  end if;
  if v_student <> v_uid then
    raise exception 'not your invoice' using errcode = '42501';
  end if;
  if v_status <> 'unpaid' then
    raise exception 'invoice is not unpaid' using errcode = 'P0001';
  end if;
  update public.invoices
     set status = 'paid', paid_at = now(), paid_by = v_uid
   where id = p_invoice_id;
end;
$$;

-- An admin cancels an unpaid invoice and frees the seat.
create or replace function public.cancel_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_enrollment uuid;
begin
  if not private.is_admin() then
    raise exception 'only admins can cancel invoices' using errcode = '42501';
  end if;
  select status, enrollment_id into v_status, v_enrollment
    from public.invoices
   where id = p_invoice_id
   for update;
  if v_status is null then
    raise exception 'invoice not found';
  end if;
  if v_status <> 'unpaid' then
    raise exception 'only unpaid invoices can be cancelled' using errcode = 'P0001';
  end if;
  update public.invoices
     set status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid
   where id = p_invoice_id;
  update public.enrollments
     set status = 'cancelled'
   where id = v_enrollment;
end;
$$;

revoke all on function public.enroll_student(uuid) from public, anon;
revoke all on function public.pay_invoice(uuid) from public, anon;
revoke all on function public.cancel_invoice(uuid) from public, anon;
grant execute on function public.enroll_student(uuid) to authenticated, service_role;
grant execute on function public.pay_invoice(uuid) to authenticated, service_role;
grant execute on function public.cancel_invoice(uuid) to authenticated, service_role;
