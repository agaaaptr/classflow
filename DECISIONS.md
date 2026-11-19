# ClassFlow — Decisions

The brief leaves several product decisions open on purpose. These are the choices, why each one, and what was rejected.

## Open decisions

### D1 — Package structure: fixed hour package per class

Every student of a class buys the same package (e.g. 12 hours = 720 minutes); the invoice amount is `package_hours × student_rate_per_hour`.

- **Why:** the brief's example ("12 hours") and the group-class model imply one uniform package per class. It keeps invoicing a single multiplication and makes the admin's margin math trivial.
- **Rejected:** per-student variable packages. More flexible, but adds a package catalog, per-enrollment pricing, and more admin input — none of which the brief asks for.

### D2 — Balance deduction: automatic at lesson end

A student's "hours left" decreases automatically when a lesson ends (`ends_at <= now()`), starting from the moment they paid. Absence still deducts; there is no attendance feature.

- **Why:** the brief says "one entry per lesson that has ended" and never mentions attendance. Deriving consumption from ended lessons is the simplest reading, and "hours left = package − ended lessons after paid_at" needs no background job or usage ledger.
- **Rejected:** deducting on attendance/approval (the more general ledger pattern) — correct for a school with no-shows and credits, but it would introduce a concept the brief doesn't have.
- **Trade-off recorded:** editing a past lesson's time retroactively changes the balance. Accepted for the 1-day scope.

### D3 — Payment: student self-pay (simulated)

The student clicks "Bayar" and their invoice becomes `paid` instantly; the admin monitors unpaid invoices. No gateway.

- **Why:** the brief says "students pay before they get access" and "payment is simulated, with no payment gateway". Self-pay is the literal reading and gives students a working flow end-to-end.
- **Rejected:** admin marks an invoice paid after offline confirmation. More conservative (an auditorially clean no-gateway pattern), but it removes the student's own action and the brief frames payment from the student's side.

### D4 — Improvements: all three (A + B + C)

All three candidate improvements are built (see below) because each answers a stated pain point from "How the business works".

### D5 — Invoice cancellation: admin cancels unpaid

An admin can cancel an `unpaid` invoice; the enrollment becomes `cancelled`, freeing the seat (a new enrollment is allowed again).

- **Why:** the capacity rule (an unpaid enrollment reserves a seat) would otherwise let a non-paying student block a paying one forever. Cancellation gives the admin the recovery action "oversee invoices" implies.
- **Rejected:** no cancellation (leaves the blocked-seat hole) and auto-expiry (adds background jobs/timeouts the brief doesn't ask for).

### Catalog visibility (documented)

Students can read the bare class catalog (name, capacity, package) before payment, because the enrollment flow ("enroll and receive an invoice") requires it. The class's schedule, logbooks, and hours-left stay gated by `student_has_paid()`. This is the reading of "students see only classes they have paid for": the *content* is gated; the *catalog* is not.

## Improvements

### A — Margin dashboard (admin)

Per class: revenue (Σ paid invoices) − tutor cost (Σ approved earnings) = margin, plus hours taught.

- **Who it helps:** the admin, who today "cannot easily tell whether a class is profitable".
- **Why this over alternatives:** it is the direct, read-only answer to that question, computed from the same rows that drive billing and payroll, so it can't drift.
- **Left out:** per-lesson cost breakdown and historical trend lines — the aggregate is what answers "is this class profitable".

### B — Admin summary (admin)

One screen with per-student hours left, the unpaid-invoice list (with cancel), and logbook status per class.

- **Who it helps:** the admin, who today cannot tell "how many hours each student has left" or "which invoices are unpaid".
- **Why:** these two pain points are adjacent and cheap to show together; the logbook status column closes the "is this month's logbook approved yet" gap.
- **Left out:** automated dunning/reminders (no email/notifications in scope).

### C — Tutor earnings slip (tutor)

A monthly recap per tutor: each lesson, its duration, rate, and amount, subtotal per month, and total.

- **Who it helps:** the tutor, who today "asks the admin every month what they will be paid".
- **Why:** it exposes the exact earnings rows the approval flow already writes (same single source of truth), so the tutor sees the same numbers the admin approved.
- **Left out:** printable PDF/export — the on-screen recap answers the question.

## What next with another day

1. **Hosted Supabase + deploy** (Vercel) with a real project and env promotion.
2. **Payment gateway** or a payment-proof upload with admin confirmation.
3. **Attendance / credits** so a no-show doesn't consume a seat or hours, replacing the D2 auto-deduction.
4. **Email notifications** on invoice and logbook-approval events.
5. **Renewal / top-up** packages and multi-class students.
6. **Print/PDF export** of tutor slips and invoices.
