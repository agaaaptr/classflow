begin;
select plan(16);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'classes', 'classes exists');
select has_table('public', 'class_rates', 'class_rates exists');
select has_table('public', 'lessons', 'lessons exists');
select has_table('public', 'enrollments', 'enrollments exists');
select has_table('public', 'invoices', 'invoices exists');
select has_table('public', 'logbooks', 'logbooks exists');
select has_table('public', 'logbook_entries', 'logbook_entries exists');
select has_table('public', 'tutor_earnings', 'tutor_earnings exists');

select col_is_pk('public', 'profiles', 'id', 'profiles.id is primary key');
select col_is_fk('public', 'profiles', 'id', 'profiles.id references auth.users');

select is(
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'class_rates' and column_name = 'student_rate_rp'),
  'bigint', 'student rate is bigint rupiah');
select is(
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'tutor_earnings' and column_name = 'amount_rp'),
  'bigint', 'earnings amount is bigint rupiah');

select is(
  (select count(*)::int from information_schema.triggers
    where trigger_schema = 'public' and event_object_table = 'enrollments'
      and trigger_name = 'trg_enrollment_capacity'),
  1, 'capacity trigger exists');

select is(
  (select i.indisunique from pg_index i join pg_class c on c.oid = i.indexrelid
    where c.relname = 'enrollments_active_unique'),
  true, 'active enrollment unique index');
select is(
  (select i.indisunique from pg_index i join pg_class c on c.oid = i.indexrelid
    where c.relname = 'invoices_enrollment_unique'),
  true, 'one invoice per enrollment');

select * from finish();
rollback;
