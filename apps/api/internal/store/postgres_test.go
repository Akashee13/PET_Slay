package store

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5"
)

func TestOpenOptionalStoreWithoutDatabaseURL(t *testing.T) {
	dbStore, err := Open(context.Background(), Config{
		DatabaseURL:      "",
		DatabaseRequired: false,
	})

	if err != nil {
		t.Fatalf("expected optional empty database to be allowed, got %v", err)
	}
	if dbStore == nil {
		t.Fatalf("expected store")
	}
	if dbStore.Configured() {
		t.Fatalf("expected store to report unconfigured database")
	}
}

func TestOpenRequiredStoreWithoutDatabaseURL(t *testing.T) {
	_, err := Open(context.Background(), Config{
		DatabaseURL:      "",
		DatabaseRequired: true,
	})

	if err == nil {
		t.Fatalf("expected required database without url to fail")
	}
}

func TestParsePGXConfigDisablesPreparedStatementCache(t *testing.T) {
	config, err := parsePGXConfig("postgresql://user:password@example.com:5432/postgres")
	if err != nil {
		t.Fatalf("parse pgx config: %v", err)
	}

	if config.DefaultQueryExecMode != pgx.QueryExecModeExec {
		t.Fatalf("expected query exec mode exec, got %v", config.DefaultQueryExecMode)
	}
}
