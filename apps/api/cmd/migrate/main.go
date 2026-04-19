package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/akash/pet_slay/apps/api/internal/config"
	"github.com/akash/pet_slay/apps/api/internal/store"
)

func main() {
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required to run migrations")
	}

	migrationDir := os.Getenv("MIGRATION_DIR")
	if migrationDir == "" {
		migrationDir = filepath.Join("db", "migrations")
	}

	dbStore, err := store.Open(context.Background(), store.Config{
		DatabaseURL:      cfg.DatabaseURL,
		DatabaseRequired: true,
	})
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer dbStore.Close()

	files, err := store.LoadMigrationFiles(migrationDir)
	if err != nil {
		log.Fatalf("load migrations: %v", err)
	}

	if err := store.ApplyMigrations(dbStore.DB, files); err != nil {
		log.Fatalf("apply migrations: %v", err)
	}

	log.Printf("applied %d migration file(s)", len(files))
}

