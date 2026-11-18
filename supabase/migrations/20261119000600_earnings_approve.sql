-- Tutor earnings: an append-only ledger materialized atomically by the approve
-- RPC. Approving again cannot add earnings (status gate + unique index).

create table public.tutor_earnings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id),
  class_id uuid not null references public.classes (id),
  logbook_id uuid not null references public.logbooks (id),
  lesson_id uuid not null references public.lessons (id),
  minutes int not null check (minutes > 0),
  rate_rp bigint not null check (rate_rp >= 0),
  amount_rp bigint not null check (amount_rp >= 0),
  created_at timestamptz not null default now(),
  unique (logbook_id, lesson_id)
);

alter table public.tutor_earnings enable row level security;

-- Single source of truth for the earnings math (preview and approve share it).
-- amount_rp = round(tutor_rate_rp * minutes / 60.0), minutes = lesson duration.
create or replace function public.logbook_earnings(p_logbook_id uuid)
returns table (lesson_id uuid, minutes int, rate_rp bigint, amount_rp bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tutor uuid;
begin
  select tutor_id into v_tutor from public.logbooks where id = p_logbook_id;
  if v_tutor is null then
    raise exception 'logbook not found';
  end if;
  if not (private.is_admin() or v_tutor = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select
      l.id as lesson_id,
      round(extract(epoch from (l.ends_at - l.starts_at)) / 60)::int as minutes,
      cr.tutor_rate_rp as rate_rp,
      round(
        cr.tutor_rate_rp::numeric
        * round(extract(epoch from (l.ends_at - l.starts_at)) / 60)
        / 60.0
      )::bigint as amount_rp
    from public.logbooks b
    join public.class_rates cr on cr.class_id = b.class_id
    join public.logbook_entries e on e.logbook_id = b.id
    join public.lessons l on l.id = e.lesson_id
    where b.id = p_logbook_id;
end;
$$;

create or replace function public.approve_logbook(p_logbook_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_total bigint;
begin
  if not private.is_admin() then
    raise exception 'only admins can approve logbooks' using errcode = '42501';
  end if;
  select status into v_status
    from public.logbooks
   where id = p_logbook_id
   for update;
  if v_status is null then
    raise exception 'logbook not found';
  end if;
  if v_status = 'approved' then
    select coalesce(sum(amount_rp), 0) into v_total
      from public.tutor_earnings
     where logbook_id = p_logbook_id;
    return v_total;
  end if;
  if v_status <> 'submitted' then
    raise exception 'logbook must be submitted before approval' using errcode = 'P0001';
  end if;

  update public.logbooks
     set status = 'approved', approved_at = now(), approved_by = auth.uid()
   where id = p_logbook_id;

  insert into public.tutor_earnings
    (tutor_id, class_id, logbook_id, lesson_id, minutes, rate_rp, amount_rp)
  select b.tutor_id, b.class_id, b.id, le.lesson_id, le.minutes, le.rate_rp, le.amount_rp
    from public.logbooks b
    cross join public.logbook_earnings(p_logbook_id) le
   where b.id = p_logbook_id
  on conflict (logbook_id, lesson_id) do nothing;

  select coalesce(sum(amount_rp), 0) into v_total
    from public.tutor_earnings
   where logbook_id = p_logbook_id;
  return v_total;
end;
$$;

grant select on public.tutor_earnings to authenticated;
grant all on public.tutor_earnings to service_role;

create policy earnings_select on public.tutor_earnings
  for select to authenticated
  using (private.is_admin() or tutor_id = auth.uid());

revoke all on function public.logbook_earnings(uuid) from public, anon;
revoke all on function public.approve_logbook(uuid) from public, anon;
grant execute on function public.logbook_earnings(uuid) to authenticated, service_role;
grant execute on function public.approve_logbook(uuid) to authenticated, service_role;
