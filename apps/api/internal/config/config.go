package config

import "os"

type Config struct {
	AppEnv      string
	Port        string
	DatabaseURL string
	SupabaseURL string
}

func Load() Config {
	return Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		SupabaseURL: os.Getenv("SUPABASE_URL"),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
