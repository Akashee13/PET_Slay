package config

import (
	"os"
	"strings"
)

type Config struct {
	AppEnv           string
	Port             string
	DatabaseURL      string
	DatabaseRequired bool
	SupabaseURL      string
	SupabaseAnonKey  string
	SupabaseServiceRoleKey string
}

func Load() Config {
	return Config{
		AppEnv:           getEnv("APP_ENV", "development"),
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		DatabaseRequired: parseBool(os.Getenv("DATABASE_REQUIRED")),
		SupabaseURL:      os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey:  os.Getenv("SUPABASE_ANON_KEY"),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func parseBool(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "yes", "y":
		return true
	default:
		return false
	}
}
