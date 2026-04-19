APP_NAME=pet-slay-api

.PHONY: run test fmt migrate-up migrate-down

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
