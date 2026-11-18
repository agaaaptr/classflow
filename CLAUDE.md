# ClassFlow

Group class enrollment & billing — take-home for Star Generation. Three role-based views (admin / tutor / student) over Next.js + Supabase.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4.
- Supabase local (PostgreSQL + Auth + PostgREST) via the Supabase CLI; `@supabase/ssr` 0.12.x with publishable/secret keys.
- Tests: Vitest (unit), pgTAP (DB invariants + RLS), Playwright (E2E).

## Commands

- `npm run dev` — start the app. Port 3000 may be taken by Docker on this machine; use `npm run dev -- -p 3001`.
- `supabase start` / `supabase stop` — local Postgres + Auth.
- `supabase db reset` — replay migrations + seed (fresh demo state).
- `npm test` — Vitest. `supabase test db` — pgTAP. `npm run test:e2e` — Playwright (resets DB, port 3001).
- `npm run build` / `npm run typecheck` / `npm run lint`.

## Conventions

- Money is `bigint` whole rupiah (no decimals, never float). Time is `timestamptz` UTC rendered in WIB (`Asia/Jakarta`). Duration is integer minutes.
- Every business invariant lives in Postgres (constraints, triggers, `SECURITY DEFINER` RPCs, RLS). App code is a UX layer that maps SQLSTATE (`23505`, `23P01`, `P0001`) to friendly Indonesian messages.
- UI copy is Bahasa Indonesia; docs and README are English.
- Server Components read, Server Actions mutate. Auth via `getUser()` (never `getSession()`); RLS is the real security boundary.
- `Date.now()` inside Server Components is request time (pages are dynamic via cookies) — see the eslint-disable comments.

## Layout

- `supabase/migrations/*.sql` — schema, RLS, triggers, RPCs. `supabase/seed.sql` — demo data. `supabase/tests/*.sql` — pgTAP.
- `lib/supabase/{client,server}.ts` — Supabase clients. `lib/auth.ts` — role helpers. `lib/actions/*` — server actions. `lib/utils.ts` — formatting + derived balance.
- `app/(admin|tutor|student)/` — role views. `components/` — shared UI (AppShell, Badge, ActionButton, forms).

@import ".noir/NOIR.md"
@import ".noir/rules/RULES.md"
