begin;
select plan(13);

-- The money expression is the single source of truth for earnings and invoice
-- amounts. Verify rounding (the ::numeric cast matters — integer division
-- would silently floor).
select is((select round(100000::numeric * 70 / 60.0)::bigint), 116667::bigint, '70min @ 100k rounds to 116667');
select is((select round(100000::numeric * 90 / 60.0)::bigint), 150000::bigint, '90min @ 100k = 150000');

-- Lesson rules (schedule_lesson runs as the class tutor).
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000002"}';
select throws_ok(
  $$ select public.schedule_lesson('00000000-0000-0000-0000-000000000101'::uuid, '2026-12-01 02:00:00+00'::timestamptz, '2026-12-01 01:00:00+00'::timestamptz) $$,
  '22007', 'end must be after start');
select throws_ok(
  $$ select public.schedule_lesson('00000000-0000-0000-0000-000000000101'::uuid, '2026-10-10 02:00:00+00'::timestamptz, '2026-10-10 03:00:00+00'::timestamptz) $$,
  '23P01', 'conflicting key value violates exclusion constraint "lessons_tutor_no_overlap"');

-- Capacity: the class already has 2 active enrollments, so a third is rejected.
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000006"}';
select throws_ok(
  $$ select public.enroll_student('00000000-0000-0000-0000-000000000101'::uuid) $$,
  'P0001', 'class is full');

-- Admin cancels student2's unpaid invoice, freeing the seat.
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000001"}';
select lives_ok(
  $$ select public.cancel_invoice('00000000-0000-0000-0000-000000000302'::uuid) $$,
  'admin cancels unpaid invoice');
select is(
  (select status from public.enrollments where id = '00000000-0000-0000-0000-000000000202'::uuid),
  'cancelled', 'cancel frees the seat (enrollment cancelled)');

-- With a seat free, a duplicate active enrollment is caught by the unique index
-- (capacity has room, so the unique constraint is what fires).
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000004"}';
select throws_ok(
  $$ select public.enroll_student('00000000-0000-0000-0000-000000000101'::uuid) $$,
  '23505', 'duplicate key value violates unique constraint "enrollments_active_unique"');

-- A freed seat lets student3 enroll.
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000006"}';
select lives_ok(
  $$ select public.enroll_student('00000000-0000-0000-0000-000000000101'::uuid) $$,
  'student3 enrolls after seat freed');

-- Approved logbook is read-only.
select throws_ok(
  $$ update public.logbooks set status = 'draft' where id = '00000000-0000-0000-0000-000000000501'::uuid $$,
  'P0001', 'approved logbook is read-only');

-- Earnings are idempotent and computed once per lesson.
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000001"}';
select is(
  (select public.approve_logbook('00000000-0000-0000-0000-000000000502'::uuid)),
  225000::bigint, 'approve computes 2 x 112500');
select is(
  (select public.approve_logbook('00000000-0000-0000-0000-000000000502'::uuid)),
  225000::bigint, 're-approve adds nothing');
select is(
  (select count(*)::int from public.tutor_earnings where logbook_id = '00000000-0000-0000-0000-000000000502'::uuid),
  2, 'exactly one earnings row per lesson');

select * from finish();
rollback;
