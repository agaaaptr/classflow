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

# Copy the env template, then fill the publishable key with the value printed
# by `supabase start` (the local URL stays at http://127.0.0.1:54321):
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -> PUBLISHABLE_KEY
cp .env.example .env.local

# Replay migrations and seed the demo data
supabase db reset

# Run the app
npm run dev
```

Open http://localhost:3000 and sign in with one of the seeded accounts below.

> If port 3000 is already in use, run `npm run dev -- -p 3001`.

## One-command local dev (Docker)

To run the app in Docker instead of on the host, a single command starts Supabase (via the CLI, which runs Supabase's ~12 platform containers) and the app (via Docker Compose):

```bash
npm run dev:docker    # or: make dev
```

This runs `supabase start`, resets the demo seed, writes `.env.local` from the printed publishable key, then builds and starts the app container at **http://localhost:3000** (set `APP_PORT` to override the port). Supabase's own services (Postgres, Auth, PostgREST, Studio, …) stay in the Supabase CLI's containers; only the Next.js app runs in this repo's Compose file.

- Stop everything: `make down` (stops the app container and runs `supabase stop` for the Supabase platform). Individually: `docker compose down` (app only) or `supabase stop` (Supabase only).
- Reset the data: `supabase db reset` (never `docker compose down -v` — the database lives in Supabase's containers).

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
