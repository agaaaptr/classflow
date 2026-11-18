# **TAKE HOME TEST**

Full Stack Developer

## **Project: Group Class Enrollment & Billing**

Build three role-based views for **group classes**: one tutor teaches multiple students, students pay before they get access, and the tutor is paid for the lessons they teach. Seed one admin, two tutors and three student accounts, plus one class with a capacity of 2\.

**Time limit:** 1 day. Build it as a feature you would ship to real admins, tutors and students, not a prototype.

**Required stack:** TypeScript, Node.js, React/Next.js, Tailwind CSS, Supabase Auth/PostgreSQL and Git/GitHub. Use seeded logins; no sign-up flow. AI tools are allowed, but you must understand and be able to explain every part of what you submit.

## **How the business works**

Students buy a **package of lesson hours** for a group class (for example 12 hours) at the class's **student rate per hour**. Tutors are paid the class's **tutor rate per hour** for each lesson they teach, whatever the number of students. Our margin on a class is what students pay minus what tutors earn.

After teaching, tutors fill in a **monthly logbook** for each class: one entry per lesson, describing what happened and what comes next. Parents and students rely on it to follow progress, and admins review it before it is shared.

Today this runs on spreadsheets and WhatsApp. The admin cannot easily tell how many hours each student has left, which invoices are still unpaid, or whether a class is profitable. Tutors ask the admin every month what they will be paid.

## **Business flow**

1. **Admin:** Create classes with a student rate, a tutor rate, a capacity and an assigned tutor. Oversee students, invoices, schedules and logbooks. Before approving a month's logbook, preview what the tutor will earn for it, then approve it.

2. **Tutor:** Schedule lessons for their assigned classes. After each lesson, add its entry to that month's logbook. When the month is complete, finalise the logbook and submit it for approval. See their own earnings per lesson and in total.

3. **Student:** Enroll in a class and receive an invoice for their package. Once it is paid, see the class schedule, the approved logbooks and how many hours they have left.

## **Rules**

* Prevent duplicate enrollment and exceeding capacity.

  * Lesson times are in WIB (UTC+7): end must follow start, and a tutor's lessons cannot overlap.

  * One logbook per class per month, with one entry per lesson that has ended. Each entry has a topic, activities, tutor observation and future recommendation. Only admins approve logbooks, and an approved logbook is read-only.

  * Students see only classes they have paid for, tutors only classes assigned to them. Logbooks stay hidden from students until approved, including through the API.

  * Tutor earnings \= tutor rate × lesson hours, once per lesson in an approved logbook (90 minutes at Rp100,000 per hour earns Rp150,000). Approving again must not add earnings. Only the admin and that tutor see earnings; tutors never see student rates.

  * Payment is simulated, with no payment gateway.

## **Decisions you must make**

The brief leaves these open on purpose. There is no single right answer: pick one, enforce it in the system, and explain it in your decision log.

## **Your own improvements (required)**

Pick improvements that solve real problems from *How the business works*. For each, explain who it helps, why you chose it over other options, and what you left out. Depth matters more than count, and cosmetic UI changes alone do not count.

## **Visual theme**

Use the Star Generation theme below so the project feels like part of our product.

| Token | Value | Used for |
| :---- | :---- | :---- |
| Navy | \#2F3F5F | Primary text, sidebar, primary buttons |
| Gold | \#F1C019 | Accent, highlights, active states |
| Surface | \#FAFDFF | Cards and page background |
| Cloud | \#E0E2E7 / \#6E7585 | Borders / muted text |
| Status | \#0AB848 / \#FF2819 | Success (Paid, Approved) / destructive |
| Type & shape | DM Sans (Google Fonts) for all text, 6px corner radius on cards |  |

## **Submission**

* GitHub repository with schema and seed SQL. Commit as you go; we read the history.

  * README.md: how to set up and run the project from a fresh clone, including the seeded logins.

  * ARCHITECTURE.md (about one page): data model diagram, where business rules are enforced and why, and how the design system is organised.

  * DECISIONS.md: your answer to each open decision above, your improvements, and what you would build next with another day.