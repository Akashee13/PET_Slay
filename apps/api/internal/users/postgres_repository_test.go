package users

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/akash/pet_slay/apps/api/internal/auth"
)

func TestPostgresBuyerProfileStoreGetsLanguage(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	store := NewPostgresBuyerProfileStore(db)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT preferred_language FROM reseller_buyers WHERE auth_user_id = $1`)).
		WithArgs("buyer-dev-001").
		WillReturnRows(sqlmock.NewRows([]string{"preferred_language"}).AddRow("hinglish"))

	language := store.GetLanguage(context.Background(), "buyer-dev-001")

	if language != "hinglish" {
		t.Fatalf("expected hinglish, got %s", language)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresBuyerProfileStoreUpsertsLanguage(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	store := NewPostgresBuyerProfileStore(db)
	session := &auth.Session{
		UserID: "buyer-dev-001",
		Role:   auth.RoleBuyer,
		Email:  "buyer@example.com",
	}

	mock.ExpectExec("INSERT INTO reseller_buyers").
		WithArgs("buyer-dev-001", "buyer-dev-001", "buyer@example.com", "hindi").
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := store.SetLanguage(context.Background(), session, "hindi"); err != nil {
		t.Fatalf("set language: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

