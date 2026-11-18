-- ClassFlow demo seed. All six accounts share the password "Classflow123!".
-- Dated to Nov 2026: Oct is an approved month, Nov is submitted (pending), and
-- one lesson is always ~7 days ahead so the schedule has an upcoming row.

-- ---------------------------------------------------------------------------
-- Auth users (known password) + profiles.
-- ---------------------------------------------------------------------------
do $$
declare
  v_hash text := extensions.crypt('Classflow123!', extensions.gen_salt('bf'));
  r record;
  v_id uuid;
begin
  for r in
    select * from (values
      ('00000000-0000-0000-0000-000000000001', 'admin@classflow.dev',    'Admin',        'admin'),
      ('00000000-0000-0000-0000-000000000002', 'tutor1@classflow.dev',   'Tutor Satu',   'tutor'),
      ('00000000-0000-0000-0000-000000000003', 'tutor2@classflow.dev',   'Tutor Dua',    'tutor'),
      ('00000000-0000-0000-0000-000000000004', 'student1@classflow.dev', 'Siswa Satu',   'student'),
      ('00000000-0000-0000-0000-000000000005', 'student2@classflow.dev', 'Siswa Dua',    'student'),
      ('00000000-0000-0000-0000-000000000006', 'student3@classflow.dev', 'Siswa Tiga',   'student')
    ) as t(id, email, full_name, role)
  loop
    v_id := r.id::uuid;

    insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       phone_change_token, phone_change, reauthentication_token)
    values
      ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
       r.email, v_hash, now(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('full_name', r.full_name),
       now(), now(), '', '', '', '', '', '', '')
    on conflict do nothing;

    -- identity row: provider_id is the user UUID; email lives only in identity_data.
    insert into auth.identities
      (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values
      (v_id, v_id::text, 'email', jsonb_build_object('sub', v_id::text, 'email', r.email),
       now(), now(), now())
    on conflict do nothing;

    insert into public.profiles (id, full_name, role)
    values (v_id, r.full_name, r.role::public.app_role)
    on conflict do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Class + rates + enrollments + invoices.
-- ---------------------------------------------------------------------------
insert into public.classes (id, name, tutor_id, capacity, package_minutes)
values ('00000000-0000-0000-0000-000000000101', 'Kelas Matematika SMP',
        '00000000-0000-0000-0000-000000000002', 2, 720)
on conflict do nothing;

insert into public.class_rates (class_id, student_rate_rp, tutor_rate_rp)
values ('00000000-0000-0000-0000-000000000101', 100000, 75000)
on conflict do nothing;

insert into public.enrollments (id, class_id, student_id, package_minutes, amount_rp, status)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000004', 720, 1200000, 'active'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000005', 720, 1200000, 'active')
on conflict do nothing;

insert into public.invoices (id, enrollment_id, student_id, amount_rp, status, paid_at, paid_by)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201',
   '00000000-0000-0000-0000-000000000004', 1200000, 'paid', now(),
   '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202',
   '00000000-0000-0000-0000-000000000005', 1200000, 'unpaid', null, null)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Lessons (timestamptz UTC; WIB = UTC+7). Oct approved, Nov submitted, one upcoming.
-- ---------------------------------------------------------------------------
insert into public.lessons (id, class_id, tutor_id, starts_at, ends_at)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', '2026-10-10 02:00:00+00', '2026-10-10 03:30:00+00'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', '2026-10-17 02:00:00+00', '2026-10-17 03:30:00+00'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', '2026-11-10 02:00:00+00', '2026-11-10 03:30:00+00'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', '2026-11-14 02:00:00+00', '2026-11-14 03:30:00+00'),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', now() + interval '7 days', now() + interval '7 days 90 minutes')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Logbooks + entries. Oct is approved; Nov is submitted (awaiting admin approve).
-- ---------------------------------------------------------------------------
insert into public.logbooks (id, class_id, tutor_id, period, status, approved_at, approved_by)
values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', '2026-10', 'approved', now(),
   '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002', '2026-11', 'submitted', null, null)
on conflict do nothing;

insert into public.logbook_entries (id, logbook_id, lesson_id, topic, activities, observation, recommendation)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501',
   '00000000-0000-0000-0000-000000000401', 'Aljabar dasar',
   'Latihan persamaan linear satu variabel',
   'Sebagian siswa masih bingung memindahkan ruas',
   'Ulangi dengan soal cerita minggu depan'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000501',
   '00000000-0000-0000-0000-000000000402', 'Aljabar lanjutan',
   'Latihan sistem persamaan linear dua variabel',
   'Pemahaman sudah merata',
   'Lanjut ke fungsi linear'),
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000502',
   '00000000-0000-0000-0000-000000000403', 'Fungsi linear',
   'Menggambar grafik y = mx + c',
   'Beberapa siswa belum hafal gradien',
   'Beri PR menentukan gradien'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000502',
   '00000000-0000-0000-0000-000000000404', 'Fungsi kuadrat',
   'Pengenalan bentuk parabola',
   'Konsep awal diterima dengan baik',
   'Lanjut ke titik puncak')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Tutor earnings for the approved October logbook (2 lessons x 90 min x Rp75k/h).
-- ---------------------------------------------------------------------------
insert into public.tutor_earnings (id, tutor_id, class_id, logbook_id, lesson_id, minutes, rate_rp, amount_rp)
values
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000501',
   '00000000-0000-0000-0000-000000000401', 90, 75000, 112500),
  ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000501',
   '00000000-0000-0000-0000-000000000402', 90, 75000, 112500)
on conflict do nothing;
