begin;
select plan(3);

-- 1. A tutor must not be able to read the financial amount column (which would
--    let them derive the student rate).
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000002"}';
select throws_ok(
  $$ select amount_rp from public.enrollments $$,
  '42501');

reset role;

-- 2. An entry whose lesson ended in a different WIB month is rejected.
insert into public.logbooks (id, class_id, period, status)
values ('00000000-0000-0000-0000-000000000599',
        '00000000-0000-0000-0000-000000000101', '2026-12', 'draft');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000002"}';
select throws_ok(
  $$ insert into public.logbook_entries
       (logbook_id, lesson_id, topic, activities, observation, recommendation)
     values
       ('00000000-0000-0000-0000-000000000599',
        '00000000-0000-0000-0000-000000000401', 'Topik', 'Aktivitas', 'Observasi', 'Rekomendasi') $$,
  'P0001');

-- 3. Tutors still see the non-financial enrollment columns for their class.
select is(
  (select count(*)::int from public.enrollments
    where class_id = '00000000-0000-0000-0000-000000000101'),
  2, 'tutor sees assigned-class enrollments');

reset role;
select * from finish();
rollback;
