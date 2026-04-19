package store

import (
	"database/sql"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

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
	for _, file := range files {
		if strings.TrimSpace(file.SQL) == "" {
			continue
		}
		if _, err := db.Exec(file.SQL); err != nil {
			return err
		}
	}

	return nil
}

