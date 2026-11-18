# ClassFlow — Product Requirements Document

> Take-home for Star Generation — Full Stack Developer. Build three role-based views for group classes: one tutor teaches many students, students pay before access, and the tutor is paid for the lessons they teach.

## 1. Problem

Star Generation runs group-class enrollment and billing on spreadsheets and WhatsApp. Three gaps follow from that:

- The admin cannot tell at a glance how many lesson hours each student has left, which invoices are still unpaid, or whether a class is profitable.
- Tutors message the admin every month to ask what they will be paid.
- Lesson progress for students and parents lives in ad-hoc messages, and the admin must review it before it is shared.

## 2. Evidence

The brief's "How the business works" states the current state directly: *"Today this runs on spreadsheets and WhatsApp."* It then names the admin's three blind spots (hours left, unpaid invoices, class profitability) and the recurring tutor question ("Tutors ask the admin every month what they will be paid"). The scope is a 1-day take-home that must demonstrate shipping-quality role-based tooling, not a production migration.

## 3. Audience

- **Admin** — runs the business; needs oversight of students, invoices, schedules, logbooks, and margin.
- **Tutor** — teaches assigned group classes; needs to schedule lessons, keep the monthly logbook, and know their pay.
- **Student** — buys a lesson-hour package and attends; needs to pay, see the schedule, and track hours left. Parents follow progress through the student view.

## 4. Success Criteria

- A fresh clone sets up and the 6 seeded accounts (1 admin, 2 tutors, 3 students) sign in.
- Duplicate enrollment and enrollment over a class's capacity are rejected.
- Lesson end-after-start and no tutor overlap are enforced.
- One logbook per class per month; one entry per lesson that has ended; approved logbooks are read-only.
- Students see only classes they have paid for; unapproved logbooks are hidden from students even through the API.
- Tutor earnings are computed once per lesson per approved logbook and never double-count on re-approval; only the admin and that tutor see them; tutors never see student rates.
- The admin sees per-class margin, unpaid invoices, and per-student hours left, and can preview a tutor's earnings before approving a month's logbook.
- Each of the three role views works end-to-end with the seeded data.

## 5. Appetite / Mode

**1-day** time-box (from the brief). A small batch: ship the three role views and the full invariant set as a real feature, not a prototype.

## 6. Proposed Direction

A web app (Next.js + Supabase) with three role-based views:

- **Admin** — create classes (student rate, tutor rate, capacity, assigned tutor, fixed hour package), oversee students/invoices/schedules/logbooks, preview a tutor's earnings before approving a month's logbook, and see a margin dashboard.
- **Tutor** — schedule lessons for assigned classes, fill and submit the monthly logbook, and see their own earnings.
- **Student** — enroll in a class (receives an invoice), pay it (simulated), then see the schedule, approved logbooks, and hours left.

Seeded accounts, no sign-up. Payment is simulated with no gateway. Two product decisions are explicit: hours are deducted automatically when a lesson ends, and an unpaid enrollment still reserves a capacity seat (an admin can cancel an unpaid invoice to free it).

## 7. No-gos

No sign-up flow. No payment gateway or real money. No email/notifications. No lesson cancellation. No package renewal/top-up (one package per enrollment, one class per student). No attendance tracking. No separate parent account (parents read the student view). Single demo class.

## 8. Rabbit holes

- Modeling money with decimals or floats (use whole-rupiah integers).
- Adding attendance or credit-ledger machinery the brief never asked for.
- Building a real payment gateway or an auth sign-up flow.
- Over-modeling invoice state (draft/sent/overdue/dispute) beyond unpaid/paid/cancelled.
- Cosmetic-only "improvements" — the brief requires depth and justification, not count.

## 9. Open Questions

Resolved during analysis and locked as product decisions D1–D5: fixed hour package per class; auto-deduction at lesson end; student self-pay; admin-cancel-unpaid frees a seat; improvements A (margin dashboard), B (admin summary), C (tutor earnings slip). No blocking questions remain. Non-blocking display details (hours-left format, seed password pattern) are fixed in the design and adjustable without re-spec.
