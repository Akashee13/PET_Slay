package store

import "database/sql"

// Store is the shared database entry point for repository implementations.
// Concrete repositories will be added as domain work starts.
type Store struct {
	DB *sql.DB
}

func New(db *sql.DB) *Store {
	return &Store{DB: db}
}
