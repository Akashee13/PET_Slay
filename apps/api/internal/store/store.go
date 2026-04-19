package store

import (
	"context"
	"database/sql"
	"errors"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var ErrDatabaseURLRequired = errors.New("database url is required")

type Config struct {
	DatabaseURL      string
	DatabaseRequired bool
}

// Store is the shared database entry point for repository implementations.
// Concrete repositories will be added as domain work starts.
type Store struct {
	DB *sql.DB
}

func New(db *sql.DB) *Store {
	return &Store{DB: db}
}

func Open(ctx context.Context, cfg Config) (*Store, error) {
	if cfg.DatabaseURL == "" {
		if cfg.DatabaseRequired {
			return nil, ErrDatabaseURLRequired
		}

		return New(nil), nil
	}

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	return New(db), nil
}

func (s *Store) Configured() bool {
	return s != nil && s.DB != nil
}

func (s *Store) Ping(ctx context.Context) error {
	if !s.Configured() {
		return ErrDatabaseURLRequired
	}

	return s.DB.PingContext(ctx)
}

func (s *Store) Close() error {
	if !s.Configured() {
		return nil
	}

	return s.DB.Close()
}
