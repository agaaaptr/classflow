#!/usr/bin/env bash
set -euo pipefail

# One-command local dev: Supabase via the CLI, the Next.js app via Docker Compose.

# 1. Start Supabase (idempotent) and reset to the demo seed.
supabase start
supabase db reset

# 2. Read the publishable key from the CLI and write .env.local (never committed).
KEY="$(supabase status -o env | sed -n 's/^PUBLISHABLE_KEY="\(.*\)"$/\1/p' | head -1)"
if [ -z "$KEY" ]; then
  echo "Could not read PUBLISHABLE_KEY from 'supabase status -o env'." >&2
  exit 1
fi

cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${KEY}
EOF

# 3. Build and start the app container.
docker compose up --build
