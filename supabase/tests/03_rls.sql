begin;
select plan(14);

-- student1 (paid)
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000004"}';
select is((select count(*)::int from public.profiles), 1, 'student sees own profile only');
select is((select count(*)::int from public.lessons), 5, 'paid student sees class schedule');
select is((select count(*)::int from public.logbooks), 1, 'student sees only approved logbook');
select is((select count(*)::int from public.logbook_entries), 2, 'student sees approved entries only');
select is((select count(*)::int from public.invoices), 1, 'student sees own invoice only');

-- student2 (unpaid)
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000005"}';
select is((select count(*)::int from public.lessons), 0, 'unpaid student sees no schedule');
select is((select count(*)::int from public.logbooks), 0, 'unpaid student sees no logbooks');
select is((select count(*)::int from public.invoices), 1, 'unpaid student sees own invoice');

-- tutor1
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000002"}';
select is((select count(*)::int from public.class_rates), 0, 'tutor cannot read student rates');
select is((select count(*)::int from public.lessons), 5, 'tutor sees assigned class lessons');
select is((select count(*)::int from public.tutor_earnings), 2, 'tutor sees own earnings');

-- admin
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000001"}';
select is((select count(*)::int from public.profiles), 6, 'admin sees all profiles');
select is((select count(*)::int from public.class_rates), 1, 'admin sees class rates');
select is((select count(*)::int from public.tutor_earnings), 2, 'admin sees all earnings');

reset role;
select * from finish();
rollback;
