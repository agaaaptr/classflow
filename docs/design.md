# ClassFlow — Design & Locked Decisions

Group Class Enrollment & Billing — take-home untuk Star Generation.

Sumber brief: [`docs/brief.md`](./brief.md). Detail best practice: [`docs/research.md`](./research.md) (termasuk section *Corrections*).

> **Verified 2026-11-18.** Pass riset paralel kedua (8 topik, ~118 tool call) mengonfirmasi 31 klaim dan menemukan 17 koreksi + 6 kontradiksi. Semua koreksi sudah dilipat ke dokumen ini. Keputusan produk D1–D5 disetujui user; jawaban user di §2.

## 1. Intent

Tiga view berbasis role untuk kelas grup: satu tutor mengajar banyak siswa, siswa
bayar sebelum dapat akses, tutor dibayar per lesson yang diajarkan. Seed 1 admin,
2 tutor, 3 siswa, 1 kelas (kapasitas 2). Stack wajib (dari brief, tidak dinegosiasi):
TypeScript, Node.js, React/Next.js (App Router), Tailwind CSS, Supabase Auth/PostgreSQL, Git/GitHub.
Login pakai seed, tanpa sign-up flow.

## 2. Keputusan produk yang terkunci (disetujui user)

| # | Keputusan | Pilihan |
|---|---|---|
| D1 | Struktur paket | **Paket jam tetap per kelas** (mis. 12 jam = 720 menit). Invoice = `paket × student_rate/jam`. Semua siswa kelas itu membeli paket sama. |
| D2 | Pengurangan saldo jam | **Otomatis saat lesson berakhir** (`ends_at <= now()`), dihitung dari `paid_at` siswa (lihat rumus saldo). Absen tetap terpotong. Tidak ada fitur absensi. |
| D3 | Pembayaran simulasi | **Student klik "Bayar"** → status `paid` instan + akses terbuka. Admin memantau daftar `unpaid`. Tanpa gateway. |
| D4 | Improvements | **A + B + C semuanya**: A dashboard margin, B ringkasan admin, C slip earnings tutor. |
| D5 | Pembatalan invoice | **Admin bisa cancel invoice `unpaid`** → kursi terlepas (enrollment `cancelled`, tak dihitung kapasitas), re-enroll diizinkan. Invoice `paid`/`cancelled` tak bisa diubah. |

**Jawaban user atas pertanyaan klarifikasi:**
- **Kapasitas:** enrollment `unpaid` tetap memesan kursi (dihitung kapasitas).
- **Late enrollment:** hanya lesson setelah siswa join yang memotong paket (start = `paid_at`).
- **Seed login:** pola `admin@classflow.dev`, `tutor1/2@classflow.dev`, `student1..3@classflow.dev`, satu password terdokumentasi.

Keputusan ringan (default, koreksi kapan saja): folder/repo **`classflow`**, UI **Bahasa Indonesia**, README/docs **English**, seed **demo-rich**.

## 3. Data model

Uang = **`bigint` Rupiah utuh** (simplifikasi: sen obsolete; ISO 4217 eksponen IDR 2, tapi disimpan skala 0 — catat di DECISIONS.md). Waktu = **`timestamptz` UTC**; render WIB (`Asia/Jakarta`) di klien. Durasi = **menit integer**. Rate = **Rp per jam** (`bigint`).

**Rumus uang (satu sumber, dipakai preview & RPC):**
`amount_rp = round(rate_rp::numeric * minutes / 60.0)::bigint`
— `::numeric` wajib, karena `rate * menit / 60` integer-divide duluan dan `round()` jadi no-op (70 menit @ Rp100k harus Rp116.667, bukan 116.666). Pembulatan half-away-from-zero per lesson (default `round()` numeric).

| Tabel | Kolom kunci | Catatan |
|---|---|---|
| `profiles` | `id` → `auth.users`, `full_name`, `role` (`admin`/`tutor`/`student`) | Role = sumber kebenaran; kolom role **dikunci** via column-level grant (lihat §4) |
| `classes` | `name`, `tutor_id`, `student_rate_rp`, `tutor_rate_rp`, `capacity`, `package_minutes` | `CHECK (student_rate_rp >= 0 AND tutor_rate_rp >= 0)`; `package_minutes` snapshot jam paket |
| `enrollments` | `class_id`, `student_id`, `package_minutes`, `amount_rp`, `status` (`active`/`cancelled`), `created_at` | Partial unique `(class_id, student_id) WHERE status='active'`; `CHECK (amount_rp >= 0)` |
| `invoices` | `enrollment_id`, `amount_rp`, `status` (`unpaid`/`paid`/`cancelled`), `paid_at`, `paid_by`, `cancelled_at`, `cancelled_by` | 1 invoice per enrollment; `CHECK (amount_rp >= 0)` |
| `lessons` | `class_id`, `tutor_id`, `starts_at`, `ends_at` | `CHECK (ends_at > starts_at)` + exclusion overlap |
| `logbooks` | `class_id`, `tutor_id`, `period` (`YYYY-MM`), `status` (`draft`/`submitted`/`approved`), `approved_at`, `approved_by` | `UNIQUE (class_id, period)` — satu logbook/kelas/bulan |
| `logbook_entries` | `logbook_id`, `lesson_id`, `topic`, `activities`, `observation`, `recommendation` | `UNIQUE (logbook_id, lesson_id)`; hanya lesson yang sudah berakhir |
| `tutor_earnings` | `tutor_id`, `class_id`, `logbook_id`, `lesson_id`, `minutes`, `rate_rp`, `amount_rp`, `created_at` | Append-only; `UNIQUE (logbook_id, lesson_id)`; `CHECK (amount_rp >= 0)` |

**Saldo jam = derived.** `jam_tersisa = enrollment.package_minutes − Σ duration(lessons WHERE ends_at <= now() AND ends_at >= enrollment.paid_at)` untuk enrollment `paid`. Pakai snapshot `enrollment.package_minutes` (bukan kolom kelas). Lesson "berakhir" otomatis lewat waktu — tidak butuh ledger konsumsi/background job. Trade-off tercatat: mengubah `ends_at` lesson lampau mengubah saldo retroaktif (diterima untuk scope 1 hari).

**Periode logbook** = `to_char(ends_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM')` — batas tengah malam WIB (lesson 00:01 WIB 1 Nov masuk November, bukan Oktober-UTC).

**Earnings = ledger materialized** (idempotensi "approve lagi ≠ bayar lagi" + audit). Ditulis atomik di `approve_logbook()`. Kunci idempoten = `UNIQUE (logbook_id, lesson_id)` (constraint biasa, cukup untuk `ON CONFLICT (logbook_id, lesson_id)`).

## 4. Di mana aturan bisnis di-enforce

| Aturan brief | Mekanisme |
|---|---|
| No duplicate enrollment | Partial unique index `(class_id, student_id) WHERE status='active'` |
| Kapasitas tak boleh lewat | Trigger `BEFORE INSERT` pada enrollments `status='active'`: `SELECT … FOR UPDATE` baris kelas + hitung active; raise `P0001` bila `count >= capacity` |
| `end > start` | `CHECK (ends_at > starts_at)` + `NOT NULL` |
| Tutor tak boleh overlap | `EXCLUDE USING gist (tutor_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` + `btree_gist`; error `23P01` → 409. Pakai default `[)` — jangan `[]` |
| Satu logbook/kelas/bulan | `UNIQUE (class_id, period)` |
| Satu entry per lesson berakhir | `UNIQUE (logbook_id, lesson_id)` + cek `lesson.ends_at <= now()` di Server Action |
| Hanya admin approve | RPC `approve_logbook()` `SECURITY DEFINER`: cek role admin + transisi `status <> 'approved'` (gate idempoten) + tulis earnings + set `approved_by`/`approved_at` satu transaksi |
| Approved = read-only | Trigger `BEFORE UPDATE/DELETE` raise saat `OLD.status = 'approved'` |
| Student hanya lihat kelas yang dibayar | RLS via helper `student_has_paid(class_id)` (invoice `paid`) |
| Tutor hanya lihat kelas assign-nya | RLS `tutor_id = auth.uid()` |
| Logbook tersembunyi sampai approved (termasuk API) | RLS: student SELECT hanya `status = 'approved'` **dan** sudah bayar |
| Earnings hanya admin + tutor bersangkutan | RLS SELECT-only: `is_admin()` OR `tutor_id = auth.uid()`; INSERT/UPDATE/DELETE revoked dari client (semua tulis lewat RPC) |
| Tutor tak boleh lihat student rate | Column-level grant: `student_rate_rp` di-omit dari grant SELECT `authenticated`; diekspos via function/view admin-only |
| Role tak bisa self-escalate | Column-level grant: `revoke update on profiles from authenticated; grant update (full_name) on profiles to authenticated;` (atau trigger BEFORE UPDATE blokir ubah role non-admin) |

**Helper role** (koreksi riset): `get_user_role()` `SECURITY DEFINER STABLE SET search_path = ''` di schema `private`; `revoke execute from public, anon; grant execute to authenticated;` — **jangan** revoke dari `authenticated` (policy jalan sebagai caller).

**Lapisan keamanan:** RLS = batas sebenarnya (tak bisa dilewati API); guard route/layout hanya UX; auth check pakai `getUser()`/`getClaims()` (bukan `getSession()`); `secret` key server-only. Test policy dengan impersonasi (`set local role authenticated` / pgTAP), bukan di SQL editor (service_role bypass RLS).

## 5. Arsitektur aplikasi (Next.js 16 + Supabase)

- Next.js **16.4.x**, `@supabase/ssr` **0.12.x**. Pola 3 klien: `lib/supabase/client.ts` (`createBrowserClient` singleton), `lib/supabase/server.ts` (`createServerClient` per-request, pakai request/response cookies + adapter `getAll`/`setAll`), **`proxy.ts`** (export `proxy()`, refresh token + propagate cookies — `middleware.ts` deprecated di Next 16, runtime Node).
- Baca data di **Server Components**; mutasi di **Server Actions** (validasi Zod, return ter-typing, `revalidatePath`). Route Handler hanya untuk callback eksternal (tidak ada untuk scope ini).
- Key: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (client), `SUPABASE_SECRET_KEY` (server-only, tanpa prefix `NEXT_PUBLIC_`).
- Migration: **aktifkan RLS DAN GRANT** (`authenticated` + `anon` untuk public read + `service_role` + `GRANT USAGE ON SEQUENCES`). Sejak 2026 (opt-in 28 Apr, default 30 Mei, wajib semua 30 Okt) proyek baru tak auto-GRANT Data API.
- Ekstensi eksplisit: `pgcrypto` (`crypt`/`gen_salt`), `btree_gist`.
- Seed user password-known via `crypt(gen_salt('bf'))` ke `auth.users` + `auth.identities`; verifikasi `supabase db reset`.
- Map SQLSTATE → pesan ramah: `23505` duplikat, `23P01` overlap (409), `P0001` kapasitas penuh.
- Index tambahan: `btree (lessons.tutor_id, starts_at)` untuk query upcoming/bulanan (GiST exclusion saja tidak cukup).

## 6. Design system (tema Star Generation)

Token sebagai CSS variables di Tailwind (`:root`), lalu dipakai komponen:

| Token | Nilai | Pemakaian |
|---|---|---|
| Navy | `#2F3F5F` | Teks utama, sidebar, tombol primer |
| Gold | `#F1C019` | Aksen, highlight, active state |
| Surface | `#FAFDFF` | Kartu & latar halaman |
| Cloud | `#E0E2E7` / `#6E7585` | Border / teks muted |
| Status | `#0AB848` / `#FF2819` | Sukses (Paid, Approved) / destruktif |

Font **DM Sans** (Google Fonts) untuk semua teks; radius sudut kartu **6px**.

## 7. Seed (demo-rich)

- 6 akun (password sama terdokumentasi, mis. `Classflow123!`): `admin@classflow.dev`, `tutor1@classflow.dev`, `tutor2@classflow.dev`, `student1@classflow.dev`, `student2@classflow.dev`, `student3@classflow.dev`.
- Seed `auth.users` + `auth.identities` **dengan pola yang benar**: di `auth.identities` tulis `provider_id` = UUID user dan `identity_data = jsonb_build_object('sub', <uid>::text, 'email', '<email>')`, `provider = 'email'`; **jangan** insert kolom `id` (auto-PK) atau `email` (GENERATED, error 428C9). Semua kolom token `auth.users` di-set string kosong (bukan NULL).
- 1 kelas kapasitas **2**, tutor = tutor1, `student_rate_rp = 100000`, `tutor_rate_rp = 75000`, `package_minutes = 720`.
- Enrollments: **student1 → paid**, **student2 → unpaid**; student3 **tidak ter-enroll** (percobaan enroll student3 ditolak kapasitas — mendemonstrasikan rule kapasitas).
- Lessons: Okt 2026 2× (berakhir) → logbook Okt **approved** + earnings; Nov 2026 2× berakhir + 1× upcoming → logbook Nov **submitted** (menunggu preview + approve admin). Tanggal relatif ke `now()` supaya demo selalu terasa baru.

Hasilnya ketiga view langsung hidup: admin melihat margin + unpaid + preview approve + bisa cancel invoice unpaid; tutor melihat earnings Okt + logbook Nov; student1 melihat jadwal + logbook Okt (approved) + sisa jam; student2 melihat invoice unpaid tanpa akses.

## 8. Improvements (A + B + C)

- **A — Dashboard margin (admin):** per kelas: Σ invoice `paid` (revenue) − Σ `tutor_earnings` (approved) = margin; margin/jam. Menjawab "apakah kelas ini untung". Read-only, admin-only.
- **B — Ringkasan admin:** satu layar: sisa jam per siswa (derived), daftar invoice `unpaid`, status logbook per kelas, + aksi cancel unpaid. Menjawab pain point admin sekaligus.
- **C — Slip earnings tutor:** rekap bulanan per tutor: per lesson + total + per kelas. Menjawab "tutor bertanya tiap bulan". Tutor melihat miliknya sendiri (RLS).

## 9. Non-goals / ditinggalkan (catat di DECISIONS.md)

Tanpa sign-up, tanpa payment gateway, tanpa email/notifikasi, **tanpa pembatalan lesson** (cancel invoice ≠ cancel lesson), tanpa renew/top-up (satu paket per enrollment — satu kelas per siswa), tanpa absensi, tanpa akun parent terpisah (orang tua membaca lewat view siswa), ganti tutor tengah bulan = out of scope, demo satu kelas.

## 10. Sesi berikutnya

Analisis + verifikasi riset **selesai**; keputusan D1–D5 terkunci dan dilipat ke dokumen ini. Langkah berikutnya: `noir-planning` / `superpowers:writing-plans` dari dokumen ini → `noir-test-driven-development` + `noir-executing-plans` untuk membangun. Deliverable final sesuai brief: schema+seed SQL, `README.md` (setup + seeded logins), `ARCHITECTURE.md` (data model diagram + enforcement + design system), `DECISIONS.md` (jawaban open decision + improvements + "what next with another day"). Konten `DECISIONS.md`/`ARCHITECTURE.md` diturunkan dari §2–§5, §8, §9.
