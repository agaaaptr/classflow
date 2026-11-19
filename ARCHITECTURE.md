# ClassFlow — Architecture

Next.js App Router + Supabase. One page per role, Server Components for reads, Server Actions for writes, PostgreSQL as the source of truth for every business rule.

## Data model

```
auth.users
  └─ profiles (id → auth.users.id, full_name, role: admin|tutor|student)

profiles
  ├─(tutor_id)─ classes (name, tutor_id, capacity, package_minutes)
  │                └─ class_rates (class_id → classes.id, student_rate_rp, tutor_rate_rp)   [admin-only]
  │                └─ lessons (class_id, tutor_id, starts_at, ends_at)                      [EXCLUDE overlap]
  │
  └─(student_id)─ enrollments (class_id, student_id, package_minutes, amount_rp, status)
                      └─ invoices (enrollment_id, student_id, amount_rp, status, paid_at)

classes
  └─ logbooks (class_id, tutor_id, period "YYYY-MM", status)        UNIQUE(class_id, period)
       └─ logbook_entries (logbook_id, lesson_id, topic, activities, observation, recommendation)
       └─ tutor_earnings (tutor_id, class_id, logbook_id, lesson_id, minutes, rate_rp, amount_rp)
```

Key modelling choices:

- **Money** is `bigint` whole rupiah (no decimals, never float). **Time** is `timestamptz` UTC, rendered in WIB. **Duration** is integer minutes.
- `class_rates` is a separate admin-only table so a tutor can never read a student rate.
- **Hours left** is derived, never stored: `package_minutes − Σ duration(lessons where ends_at <= now() and ends_at >= paid_at)`.
- **Tutor earnings** is an append-only ledger materialised atomically by `approve_logbook()`, keyed `UNIQUE(logbook_id, lesson_id)` so re-approval never double-pays.

## Where rules are enforced

Business rules live in the database; the app layer is UX + friendly error mapping.

| Rule | Mechanism |
| --- | --- |
| No duplicate enrollment | Partial unique index `(class_id, student_id) WHERE status='active'` |
| Capacity not exceeded | `BEFORE INSERT` trigger locks the class row, counts active enrollments, raises `P0001` |
| Lesson end after start | `CHECK (ends_at > starts_at)` |
| Tutor lessons don't overlap | `EXCLUDE USING gist (tutor_id =, tstzrange(starts_at, ends_at) &&)` + `btree_gist` → `23P01`/409 |
| One logbook per class per month | `UNIQUE (class_id, period)` |
| One entry per ended lesson | `UNIQUE (logbook_id, lesson_id)` + trigger (lesson ended, same class, same WIB month) |
| Only admin approves | `approve_logbook()` SECURITY DEFINER, admin-only, idempotent |
| Approved logbook read-only | `BEFORE UPDATE/DELETE` trigger raises when `status='approved'` |
| Students see only paid classes | RLS `student_has_paid(class_id)` |
| Tutors see only assigned classes | RLS `tutor_id = auth.uid()` (classes, lessons, logbooks, earnings) |
| Logbooks hidden until approved (incl. API) | RLS `status='approved'` + paid |
| Earnings visible only to admin + that tutor | RLS `is_admin() or tutor_id = auth.uid()` |
| Tutors never see student rates | `class_rates` has no tutor RLS policy (admin-only) |
| Role can't self-escalate | Column grants: clients can only update `full_name`, never `role` |

Every mutation is a `SECURITY DEFINER` RPC or an RLS-guarded write; the DB is the non-bypassable boundary. Server-side auth checks use `getUser()` (never `getSession()`); the `service_role`/secret key never reaches the browser.

## Design system

The Star Generation theme is registered as Tailwind v4 `@theme` tokens in `app/globals.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--color-navy` | `#2F3F5F` | primary text, sidebar, primary buttons |
| `--color-gold` | `#F1C019` | accent, active nav, highlights |
| `--color-surface` | `#FAFDFF` | page/card background |
| `--color-cloud` | `#E0E2E7` / `#6E7585` | borders / muted text |
| `--color-success` | `#0AB848` | paid, approved |
| `--color-danger` | `#FF2819` | destructive, cancelled |
| `--font-sans` | DM Sans (Google Fonts) | all text |
| `--radius-card` | `6px` | card corners |

Components (`components/`) reuse these tokens; status is conveyed with `Badge` (color-coded pill), and the navy sidebar is the single bold anchor with gold reserved for the active state.
