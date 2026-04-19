APP_NAME=pet-slay-api

.PHONY: run test fmt migrate-up migrate-down seed-stage-catalog verify-stage-api

run:
	go run ./cmd/server

test:
	go test ./...

fmt:
	go fmt ./...

migrate-up:
	./scripts/migrate.sh up

migrate-down:
	./scripts/migrate.sh down

seed-stage-catalog:
	./scripts/seed-stage-catalog.sh

verify-stage-api:
	../../scripts/verify-stage-api.sh
