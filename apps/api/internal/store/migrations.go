package store

import (
	"database/sql"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const ensureSchemaMigrationsTableSQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
	name TEXT PRIMARY KEY,
	applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`

const selectAppliedMigrationsSQL = `SELECT name FROM schema_migrations`

const insertAppliedMigrationSQL = `INSERT INTO schema_migrations (name) VALUES ($1)`

type MigrationFile struct {
	Name string
	Path string
	SQL  string
}

func LoadMigrationFiles(dir string) ([]MigrationFile, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	files := make([]MigrationFile, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		path := filepath.Join(dir, entry.Name())
		content, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}

		files = append(files, MigrationFile{
			Name: entry.Name(),
			Path: path,
			SQL:  string(content),
		})
	}

	sort.Slice(files, func(i, j int) bool {
		return files[i].Name < files[j].Name
	})

	return files, nil
}

func ApplyMigrations(db *sql.DB, files []MigrationFile) error {
	if _, err := db.Exec(ensureSchemaMigrationsTableSQL); err != nil {
		return err
	}

	applied, err := loadAppliedMigrations(db)
	if err != nil {
		return err
	}

	for _, file := range files {
		if strings.TrimSpace(file.SQL) == "" {
			continue
		}
		if _, exists := applied[file.Name]; exists {
			continue
		}

		tx, err := db.Begin()
		if err != nil {
			return err
		}

		if _, err := tx.Exec(file.SQL); err != nil {
			_ = tx.Rollback()
			return err
		}

		if _, err := tx.Exec(insertAppliedMigrationSQL, file.Name); err != nil {
			_ = tx.Rollback()
			return err
		}

		if err := tx.Commit(); err != nil {
			return err
		}

		applied[file.Name] = struct{}{}
	}

	return nil
}

func loadAppliedMigrations(db *sql.DB) (map[string]struct{}, error) {
	rows, err := db.Query(selectAppliedMigrationsSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := map[string]struct{}{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		applied[name] = struct{}{}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return applied, nil
}
