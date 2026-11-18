-- Profiles: the authoritative role store. The role column is locked by column
-- privileges so no client can self-promote to admin.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER helpers bypass RLS, so they can read profiles from inside a
-- profiles policy without recursing. search_path = '' + schema-qualified names
-- closes the function-hijacking path.
create or replace function private.get_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke all on function private.get_user_role() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.get_user_role() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

-- Clients may read profiles and update only their own full_name. Role changes
-- are impossible through the Data API (column grant + no insert/delete grant).
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
