package store

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadMigrationFilesInOrder(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "0002_second.sql"), []byte("SELECT 2;"), 0o600); err != nil {
		t.Fatalf("write migration: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "0001_first.sql"), []byte("SELECT 1;"), 0o600); err != nil {
		t.Fatalf("write migration: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "README.md"), []byte("ignore"), 0o600); err != nil {
		t.Fatalf("write readme: %v", err)
	}

	files, err := LoadMigrationFiles(dir)
	if err != nil {
		t.Fatalf("load migrations: %v", err)
	}

	if len(files) != 2 {
		t.Fatalf("expected 2 sql files, got %d", len(files))
	}
	if files[0].Name != "0001_first.sql" {
		t.Fatalf("expected first migration sorted first, got %s", files[0].Name)
	}
	if files[1].SQL != "SELECT 2;" {
		t.Fatalf("expected second migration sql, got %s", files[1].SQL)
	}
}

