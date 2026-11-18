# ClassFlow — Design & Locked Decisions

Group Class Enrollment & Billing — take-home untuk Star Generation.

Sumber brief: [`docs/brief.md`](./brief.md). Detail best practice: [`docs/research.md`](./research.md).

## 1. Intent

Tiga view berbasis role untuk kelas grup: satu tutor mengajar banyak siswa, siswa
bayar sebelum dapat akses, tutor dibayar per lesson yang diajarkan. Seed 1 admin,
2 tutor, 3 siswa, 1 kelas (kapasitas 2). Stack wajib (dari brief, tidak dinegosiasi):
TypeScript, Node.js, React/Next.js (App Router), Tailwind CSS, Supabase Auth/PostgreSQL, Git/GitHub.
Login pakai seed, tanpa sign-up flow.

## 2. Keputusan produk yang terkunci (disetujui user)

| # | Keputusan | Pilihan |
|---|---|---|
| D1 | Struktur paket | **Paket jam tetap per kelas** (mis. 12 jam). Invoice = `paket_jam × student_rate/jam`. Semua siswa kelas itu membeli paket sama. |
| D2 | Pengurangan saldo jam | **Otomatis saat lesson berakhir** (`ends_at <= now()`). Absen tetap terpotong (slot kapasitas terpakai). Tidak ada fitur absensi. |
| D3 | Pembayaran simulasi | **Student klik "Bayar"** → status `paid` instan + akses terbuka. Admin memantau daftar `unpaid`. Tanpa gateway. |
| D4 | Improvements | **A + B + C semuanya**: A dashboard margin, B ringkasan admin, C slip earnings tutor. |

Keputusan ringan (default saya, koreksi kapan saja): folder/repo **`classflow`**,
UI **Bahasa Indonesia**, README/docs **English**, seed **demo-rich**.

## 3. Data model

Uang = **`bigint` Rupiah utuh** (tanpa pecahan, tanpa float/tipe `money`).
Waktu = **`timestamptz` UTC**; render WIB (`Asia/Jakarta`) di klien.
Durasi = **menit integer** (12 jam = 720; lesson 90 menit = 90) — bebas float.
Rate = **Rp per jam** (`bigint`). Perhitungan uang: `round(rate × menit / 60)`
dengan aritmetika `numeric` eksak di Postgres, dibulatkan ke Rupiah utuh.

| Tabel | Kolom kunci | Catatan |
|---|---|---|
| `profiles` | `id` → `auth.users`, `full_name`, `role` (`admin`/`tutor`/`student`) | Role = sumber kebenaran; kolom role **dikunci** dari self-update |
| `classes` | `name`, `tutor_id`, `student_rate_rp`, `tutor_rate_rp`, `capacity`, `package_minutes` | `package_minutes` snapshot jam paket |
| `enrollments` | `class_id`, `student_id`, `package_minutes`, `amount_rp`, `created_at` | `UNIQUE (class_id, student_id)` — cegah duplikat |
| `invoices` | `enrollment_id`, `amount_rp`, `status` (`unpaid`/`paid`/`cancelled`), `paid_at` | 1 invoice per enrollment |
| `lessons` | `class_id`, `tutor_id`, `starts_at`, `ends_at` | `CHECK ends_at > starts_at` + exclusion overlap |
| `logbooks` | `class_id`, `tutor_id`, `period` (`YYYY-MM`), `status` (`draft`/`submitted`/`approved`), `approved_at`, `approved_by` | `UNIQUE (class_id, period)` — satu logbook/kelas/bulan |
| `logbook_entries` | `logbook_id`, `lesson_id`, `topic`, `activities`, `observation`, `recommendation` | `UNIQUE (logbook_id, lesson_id)`; hanya lesson yang sudah berakhir |
| `tutor_earnings` | `tutor_id`, `class_id`, `logbook_id`, `lesson_id`, `minutes`, `rate_rp`, `amount_rp`, `created_at` | Append-only; `UNIQUE (logbook_id, lesson_id)` → idempotent |

**Saldo jam = derived, bukan kolom tersimpan.** `jam_tersisa = package_minutes − Σ duration(lessons kelas dengan ends_at <= now(), non-cancelled)`.
Lesson "berakhir" terjadi otomatis lewat waktu, jadi tidak butuh ledger konsumsi
maupun background job. Trade-off yang dicatat: mengubah `ends_at` lesson lampau
mengubah saldo retroaktif — diterima untuk scope 1 hari.

**Earnings = ledger materialized** (wajib untuk idempotensi "approve lagi ≠ bayar lagi"
dan audit). Ditulis atomik di dalam `approve_logbook()`.

## 4. Di mana aturan bisnis di-enforce (ringkasan)

| Aturan brief | Mekanisme |
|---|---|
| No duplicate enrollment | `UNIQUE (class_id, student_id)` |
| Kapasitas tidak boleh lewat | Trigger `BEFORE INSERT` pada enrollments: `SELECT … FOR UPDATE` baris kelas + hitung; raise `P0001` bila `count >= capacity` |
| `end > start` | `CHECK (ends_at > starts_at)` |
| Tutor tidak boleh overlap | `EXCLUDE USING gist (tutor_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` + ekstensi `btree_gist`; error `23P01` → 409 |
| Satu logbook/kelas/bulan | `UNIQUE (class_id, period)` |
| Satu entry per lesson yang sudah berakhir | `UNIQUE (logbook_id, lesson_id)` + cek `lesson.ends_at <= now()` di Server Action |
| Hanya admin approve | RPC `approve_logbook()` `SECURITY DEFINER`: cek role admin + transisi `status <> 'approved'` (gate idempoten) + tulis earnings + set `approved_by`/`approved_at` dalam satu transaksi |
| Approved = read-only | Trigger `BEFORE UPDATE/DELETE` raise saat `OLD.status = 'approved'` |
| Student hanya lihat kelas yang dibayar | RLS via helper `student_has_paid(class_id)` |
| Tutor hanya lihat kelas assign-nya | RLS `tutor_id = auth.uid()` |
| Logbook tersembunyi sampai approved (termasuk API) | RLS: student SELECT hanya `status = 'approved'` **dan** sudah bayar |
| Earnings hanya admin + tutor bersangkutan | RLS: `is_admin()` OR `tutor_id = auth.uid()` |
| Tutor tak boleh lihat student rate | `student_rate_rp` tidak pernah diekspos ke role tutor (view/kolom terpisah + RLS) |

**Lapisan keamanan:** RLS = batas sebenarnya (tak bisa dilewati API); guard route/layout
hanya UX; auth check pakai `getUser()` (bukan `getSession()`); `service_role` server-only.

## 5. Arsitektur aplikasi (Next.js + Supabase)

- Pola 3 klien `@supabase/ssr`: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server, per-request), `middleware.ts` (refresh token + propagate cookies).
- Baca data di **Server Components**; mutasi di **Server Actions** (validasi Zod, return ter-typing, `revalidatePath` setelah write). Route Handler hanya untuk callback eksternal (tidak ada untuk scope ini).
- Role disimpan di `profiles.role`; helper `SECURITY DEFINER get_user_role()` dengan `search_path = ''`; policy per-role dengan `USING` + `WITH CHECK`.
- Seed user password-known via `crypt(gen_salt('bf'))` ke `auth.users` + `auth.identities`; verifikasi `supabase db reset`.
- Map SQLSTATE → pesan ramah: `23505` duplikat, `23P01` overlap (409), `P0001` kapasitas penuh.
- BigInt diserialisasi sebagai string di batas API.

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

- 6 akun: 1 admin, 2 tutor, 3 siswa (login email+password dikenal).
- 1 kelas kapasitas **2**, tutor = tutor1, mis. `package_minutes = 720` (12 jam).
- Enrollments: **student1 → paid**, **student2 → unpaid**; student3 **tidak ter-enroll**
  (percobaan enroll student3 ditolak kapasitas — mendemonstrasikan rule kapasitas).
- Lessons: Okt 2026 2× (berakhir) → logbook Okt **approved** + earnings; Nov 2026
  2× berakhir + 1× upcoming → logbook Nov **submitted** (menunggu preview + approve admin).
  Tanggal relatif ke `now()` (`now() - interval '…'`) supaya demo selalu terasa baru.

Hasilnya ketiga view langsung hidup: admin melihat margin + unpaid + preview approve;
tutor melihat earnings Okt + logbook Nov; student1 melihat jadwal + logbook Okt
(approved) + sisa jam; student2 melihat invoice unpaid tanpa akses.

## 8. Improvements (A + B + C)

- **A — Dashboard margin (admin):** per kelas: Σ invoice `paid` (revenue) − Σ `tutor_earnings`
  (approved) = margin; margin/jam. Menjawab "apakah kelas ini untung". Read-only, admin-only.
- **B — Ringkasan admin:** satu layar: sisa jam per siswa (derived), daftar invoice `unpaid`,
  status logbook per kelas. Menjawab dua pain point admin sekaligus.
- **C — Slip earnings tutor:** rekap bulanan per tutor: per lesson + total + per kelas.
  Menjawab "tutor bertanya tiap bulan". Tutor melihat miliknya sendiri (RLS).

## 9. Non-goals / ditinggalkan (catat di DECISIONS.md)

Tanpa sign-up, tanpa payment gateway, tanpa email/notifikasi, tanpa pembatalan lesson,
tanpa renew/top-up (satu paket per enrollment — satu kelas per siswa), tanpa absensi,
tanpa akun parent terpisah (orang tua membaca lewat view siswa), demo satu kelas.

## 10. Sesi berikutnya

`cd classflow` → `superpowers:writing-plans` dari dokumen ini → bangun. Deliverable final
sesuai brief: schema+seed SQL, `README.md` (setup + seeded logins), `ARCHITECTURE.md`
(data model diagram + enforcement + design system), `DECISIONS.md` (jawaban open decision
+ improvements + "what next with another day"). Konten `DECISIONS.md`/`ARCHITECTURE.md`
diturunkan dari §2, §3, §4, §8, §9 di atas.
