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

func (s *PostgresBuyerProfileStore) GetProfile(ctx context.Context, session *auth.Session) (*BuyerProfile, error) {
	if s == nil || s.db == nil {
		return defaultBuyerProfile(session), nil
	}

	profile := defaultBuyerProfile(session)
	err := s.db.QueryRowContext(ctx, `
		SELECT preferred_language, display_name, business_name, phone, region, avatar_url
		FROM reseller_buyers
		WHERE auth_user_id = $1
	`, session.UserID).Scan(&profile.PreferredLanguage, &profile.DisplayName, &profile.BusinessName, &profile.Phone, &profile.Region, &profile.AvatarURL)
	if err == sql.ErrNoRows {
		return profile, nil
	}
	if err != nil {
		return nil, err
	}

	if profile.DisplayName == "" {
		profile.DisplayName = deriveDisplayName(session)
	}
	if profile.AvatarURL == "" {
		profile.AvatarURL = session.AvatarURL
	}
	return profile, nil
}

func (s *PostgresBuyerProfileStore) SetLanguage(ctx context.Context, session *auth.Session, language string) (*BuyerProfile, error) {
	if s == nil || s.db == nil {
		profile := defaultBuyerProfile(session)
		profile.PreferredLanguage = language
		return profile, nil
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO reseller_buyers (id, auth_user_id, email, preferred_language, display_name, business_name, avatar_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
		ON CONFLICT (auth_user_id)
		DO UPDATE SET preferred_language = EXCLUDED.preferred_language, email = EXCLUDED.email, updated_at = NOW()
	`, session.UserID, session.UserID, session.Email, language, deriveDisplayName(session), "PET_Slay Demo Reseller", session.AvatarURL)
	if err != nil {
		return nil, err
	}

	return s.GetProfile(ctx, session)
}

func (s *PostgresBuyerProfileStore) UpdateProfile(ctx context.Context, session *auth.Session, input UpdateBuyerProfileInput) (*BuyerProfile, error) {
	if s == nil || s.db == nil {
		profile := defaultBuyerProfile(session)
		if input.DisplayName != "" {
			profile.DisplayName = input.DisplayName
		}
		if input.BusinessName != "" {
			profile.BusinessName = input.BusinessName
		}
		if input.Phone != "" {
			profile.Phone = input.Phone
		}
		if input.Region != "" {
			profile.Region = input.Region
		}
		if input.AvatarURL != "" {
			profile.AvatarURL = input.AvatarURL
		}
		return profile, nil
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO reseller_buyers (id, auth_user_id, email, preferred_language, display_name, business_name, phone, region, avatar_url, status)
		VALUES ($1, $2, $3, 'english', $4, $5, $6, $7, $8, 'active')
		ON CONFLICT (auth_user_id)
		DO UPDATE SET
			email = EXCLUDED.email,
			display_name = EXCLUDED.display_name,
			business_name = EXCLUDED.business_name,
			phone = EXCLUDED.phone,
			region = EXCLUDED.region,
			avatar_url = EXCLUDED.avatar_url,
			updated_at = NOW()
	`, session.UserID, session.UserID, session.Email, coalesceString(input.DisplayName, deriveDisplayName(session)), coalesceString(input.BusinessName, "PET_Slay Demo Reseller"), input.Phone, input.Region, coalesceString(input.AvatarURL, session.AvatarURL))
	if err != nil {
		return nil, err
	}

	return s.GetProfile(ctx, session)
}

func coalesceString(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}

	return ""
}
