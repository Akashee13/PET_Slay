package config

import "testing"

func TestLoadDatabaseRequiredFlag(t *testing.T) {
	t.Setenv("APP_ENV", "stage")
	t.Setenv("DATABASE_URL", "postgres://example")
	t.Setenv("DATABASE_REQUIRED", "true")

	cfg := Load()

	if cfg.AppEnv != "stage" {
		t.Fatalf("expected stage env, got %s", cfg.AppEnv)
	}
	if cfg.DatabaseURL != "postgres://example" {
		t.Fatalf("expected database url from env, got %s", cfg.DatabaseURL)
	}
	if !cfg.DatabaseRequired {
		t.Fatalf("expected database to be required")
	}
}

func TestLoadDatabaseRequiredDefaultsToFalse(t *testing.T) {
	t.Setenv("DATABASE_REQUIRED", "")

	cfg := Load()

	if cfg.DatabaseRequired {
		t.Fatalf("expected database to be optional by default")
	}
}

