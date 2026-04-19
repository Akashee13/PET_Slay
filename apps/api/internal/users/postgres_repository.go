package users

import (
	"context"
	"database/sql"

	"github.com/akash/pet_slay/apps/api/internal/auth"
)

type PostgresBuyerProfileStore struct {
	db *sql.DB
}

func NewPostgresBuyerProfileStore(db *sql.DB) *PostgresBuyerProfileStore {
	return &PostgresBuyerProfileStore{db: db}
}

func (s *PostgresBuyerProfileStore) GetLanguage(ctx context.Context, userID string) string {
	if s == nil || s.db == nil {
		return "english"
	}

	var language string
	err := s.db.QueryRowContext(ctx, `SELECT preferred_language FROM reseller_buyers WHERE auth_user_id = $1`, userID).Scan(&language)
	if err != nil {
		return "english"
	}

	return language
}

func (s *PostgresBuyerProfileStore) SetLanguage(ctx context.Context, session *auth.Session, language string) error {
	if s == nil || s.db == nil {
		return nil
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO reseller_buyers (id, auth_user_id, email, preferred_language, status)
		VALUES ($1, $2, $3, $4, 'active')
		ON CONFLICT (auth_user_id)
		DO UPDATE SET preferred_language = EXCLUDED.preferred_language, updated_at = NOW()
	`, session.UserID, session.UserID, session.Email, language)

	return err
}

