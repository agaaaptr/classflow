-- Extensions, enums, and the private helper schema.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

do $$
begin
  create type public.app_role as enum ('admin', 'tutor', 'student');
exception
  when duplicate_object then null;
end $$;

create schema if not exists private;
grant usage on schema private to authenticated, service_role;
