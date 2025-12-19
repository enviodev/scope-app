.PHONY: db-start db-stop db-reset db-setup setup

db-start:
	docker compose up -d postgres

db-stop:
	docker compose down

db-reset:
	docker compose down -v

db-setup: db-start
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@echo "PostgreSQL is ready."
	cd registry && bun install
	cd registry && bun run db:migration:apply
	cd registry && bun run generate:labels

setup: db-setup

