# ClassFlow

Group class enrollment & billing for Star Generation — a take-home exercise. Three role-based views: **admin**, **tutor**, and **student**. A tutor teaches a group class; students buy a lesson-hour package and pay before access; the tutor is paid per lesson taught.

Built with **Next.js (App Router) + Supabase (PostgreSQL, Auth, PostgREST)** and **Tailwind CSS**. All business rules are enforced in the database.

## Prerequisites

- Node.js 20+ and npm
- Docker (running)
- Supabase CLI (`npm i -g supabase` or `brew install supabase/tap/supabase`)

## Setup from a fresh clone

```bash
npm install

# Start local Postgres + Auth (first run pulls Docker images)
supabase start

# Create .env.local from the template, then fill the two values
# with the URL and key printed by `supabase start`:
#   NEXT_PUBLIC_SUPABASE_URL            -> API_URL
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -> PUBLISHABLE_KEY
cp .env.example .env.local

# Replay migrations and seed the demo data
supabase db reset

# Run the app
npm run dev
```

Open http://localhost:3000 and sign in with one of the seeded accounts below.

> Port 3000 is used by Docker on this machine; if `npm run dev` reports the port is in use, run `npm run dev -- -p 3001`.

## Seeded logins

All six accounts share the password **`Classflow123!`**.

| Role    | Email                   |
| ------- | ----------------------- |
| Admin   | `admin@classflow.dev`   |
| Tutor   | `tutor1@classflow.dev`  |
| Tutor   | `tutor2@classflow.dev`  |
| Student | `student1@classflow.dev` |
| Student | `student2@classflow.dev` |
| Student | `student3@classflow.dev` |

Demo state: one class (capacity 2) — student1 **paid**, student2 **unpaid**, student3 not enrolled (enrollment is rejected because the class is full). October logbook is **approved** with tutor earnings; November logbook is **submitted** awaiting admin approval.

## Commands

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the dev server                                      |
| `npm run build`        | Production build + typecheck                              |
| `npm run lint`         | ESLint                                                    |
| `npm run typecheck`    | `tsc --noEmit`                                            |
| `npm test`             | Vitest unit tests                                         |
| `supabase test db`     | pgTAP database tests (schema, invariants, RLS)            |
| `npm run test:e2e`     | Playwright E2E (resets the DB, runs on port 3001)         |

## Documentation

- `docs/brief.md` — the original take-home brief.
- `docs/prd.md` — product requirements.
- `docs/design.md` — locked design decisions and data model.
- `docs/research.md` — research + a corrections section from the verification pass.
- `ARCHITECTURE.md` — data model, rule enforcement, design system.
- `DECISIONS.md` — open decisions, improvements, and what's next.
