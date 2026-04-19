package store

import (
	"os"
	"path/filepath"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
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

func TestApplyMigrationsSkipsAlreadyAppliedFiles(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(ensureSchemaMigrationsTableSQL)).WillReturnResult(sqlmock.NewResult(0, 0))
	rows := sqlmock.NewRows([]string{"name"}).AddRow("0001_initial.sql")
	mock.ExpectQuery(regexp.QuoteMeta(selectAppliedMigrationsSQL)).WillReturnRows(rows)

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("CREATE TABLE bar (id INT);")).
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec(regexp.QuoteMeta(insertAppliedMigrationSQL)).WithArgs("0002_next.sql").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	files := []MigrationFile{
		{Name: "0001_initial.sql", SQL: "CREATE TABLE foo (id INT);"},
		{Name: "0002_next.sql", SQL: "CREATE TABLE bar (id INT);"},
	}

	if err := ApplyMigrations(db, files); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestApplyMigrationsRollsBackWhenMigrationFails(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(ensureSchemaMigrationsTableSQL)).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery(regexp.QuoteMeta(selectAppliedMigrationsSQL)).WillReturnRows(sqlmock.NewRows([]string{"name"}))

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("CREATE TABLE foo (id INT);")).
		WillReturnError(os.ErrPermission)
	mock.ExpectRollback()

	files := []MigrationFile{{Name: "0001_initial.sql", SQL: "CREATE TABLE foo (id INT);"}}
	err = ApplyMigrations(db, files)
	if err == nil {
		t.Fatal("expected migration error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
