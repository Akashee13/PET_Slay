package users

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/akash/pet_slay/apps/api/internal/auth"
)

func TestPostgresBuyerProfileStoreGetProfile(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	store := NewPostgresBuyerProfileStore(db)
	session := &auth.Session{
		UserID:      "buyer-dev-001",
		Role:        auth.RoleBuyer,
		Email:       "buyer@example.com",
		DisplayName: "Ruchi Arora",
		AvatarURL:   "https://cdn.example.com/ruchi.jpg",
	}

	mock.ExpectQuery(regexp.QuoteMeta(`
		SELECT preferred_language, display_name, business_name, phone, region, avatar_url
		FROM reseller_buyers
		WHERE auth_user_id = $1
	`)).
		WithArgs("buyer-dev-001").
		WillReturnRows(
			sqlmock.NewRows([]string{"preferred_language", "display_name", "business_name", "phone", "region", "avatar_url"}).
				AddRow("hinglish", "Ruchi Stores", "Ruchi Fashion House", "+91-9999999999", "Delhi NCR", "https://cdn.example.com/ruchi-updated.jpg"),
		)

	profile, err := store.GetProfile(context.Background(), session)
	if err != nil {
		t.Fatalf("get profile: %v", err)
	}

	if profile.PreferredLanguage != "hinglish" {
		t.Fatalf("expected hinglish, got %s", profile.PreferredLanguage)
	}
	if profile.DisplayName != "Ruchi Stores" {
		t.Fatalf("expected display name Ruchi Stores, got %s", profile.DisplayName)
	}
	if profile.BusinessName != "Ruchi Fashion House" {
		t.Fatalf("expected business name Ruchi Fashion House, got %s", profile.BusinessName)
	}
	if profile.Phone != "+91-9999999999" {
		t.Fatalf("expected phone, got %s", profile.Phone)
	}
	if profile.Region != "Delhi NCR" {
		t.Fatalf("expected region Delhi NCR, got %s", profile.Region)
	}
	if profile.AvatarURL != "https://cdn.example.com/ruchi-updated.jpg" {
		t.Fatalf("expected avatar url, got %s", profile.AvatarURL)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresBuyerProfileStoreSetLanguage(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	store := NewPostgresBuyerProfileStore(db)
	session := &auth.Session{
		UserID:      "buyer-dev-001",
		Role:        auth.RoleBuyer,
		Email:       "buyer@example.com",
		DisplayName: "Ruchi Arora",
		AvatarURL:   "https://cdn.example.com/ruchi.jpg",
	}

	mock.ExpectExec("INSERT INTO reseller_buyers").
		WithArgs("buyer-dev-001", "buyer-dev-001", "buyer@example.com", "hindi", "Ruchi Arora", "PET_Slay Demo Reseller", "https://cdn.example.com/ruchi.jpg").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(regexp.QuoteMeta(`
		SELECT preferred_language, display_name, business_name, phone, region, avatar_url
		FROM reseller_buyers
		WHERE auth_user_id = $1
	`)).
		WithArgs("buyer-dev-001").
		WillReturnRows(
			sqlmock.NewRows([]string{"preferred_language", "display_name", "business_name", "phone", "region", "avatar_url"}).
				AddRow("hindi", "Ruchi Arora", "PET_Slay Demo Reseller", "", "", "https://cdn.example.com/ruchi.jpg"),
		)

	profile, err := store.SetLanguage(context.Background(), session, "hindi")
	if err != nil {
		t.Fatalf("set language: %v", err)
	}
	if profile.PreferredLanguage != "hindi" {
		t.Fatalf("expected hindi, got %s", profile.PreferredLanguage)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
