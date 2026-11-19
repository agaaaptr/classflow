.PHONY: dev reset test test-db test-e2e down

# Seluruh stack di Docker (Supabase via CLI + frontend via compose).
# Buka http://localhost:3000 setelah jalan.
dev:
	bash scripts/dev-docker.sh

reset:
	supabase db reset

test:
	npm test

test-db:
	supabase test db

test-e2e:
	npm run test:e2e

down:
	docker compose down
	supabase stop
