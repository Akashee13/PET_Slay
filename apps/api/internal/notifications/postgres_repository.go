package notifications

import (
	"database/sql"
	"fmt"
	"time"
)

const upsertDeviceTokenSQL = `
INSERT INTO device_tokens (id, buyer_id, provider, token, platform, status, last_seen_at)
VALUES ($1, $2, $3, $4, $5, 'active', NOW())
ON CONFLICT (token)
DO UPDATE SET buyer_id = EXCLUDED.buyer_id, provider = EXCLUDED.provider, platform = EXCLUDED.platform, status = 'active', last_seen_at = NOW()
RETURNING id, buyer_id, provider, token, platform, status`

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) RegisterDeviceToken(input RegisterDeviceTokenInput) (*DeviceToken, bool, error) {
	if _, err := r.db.Exec(`
		INSERT INTO reseller_buyers (id, auth_user_id, status)
		VALUES ($1, $2, 'active')
		ON CONFLICT (auth_user_id) DO NOTHING
	`, input.BuyerID, input.BuyerID); err != nil {
		return nil, false, err
	}

	deviceTokenID := fmt.Sprintf("dtok-%d", time.Now().UnixNano())
	var token DeviceToken
	err := r.db.QueryRow(upsertDeviceTokenSQL, deviceTokenID, input.BuyerID, input.Provider, input.Token, input.Platform).Scan(
		&token.ID,
		&token.BuyerID,
		&token.Provider,
		&token.Token,
		&token.Platform,
		&token.Status,
	)
	if err != nil {
		return nil, false, err
	}

	return &token, true, nil
}

func (r *PostgresRepository) Create(input CreateCampaignInput) (*Campaign, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	adminID := "admin-dev-001"
	if _, err := tx.Exec(`
		INSERT INTO admin_operators (id, auth_user_id, name, email, role, status)
		VALUES ($1, $2, 'PET_Slay Admin', 'admin@example.com', 'admin', 'active')
		ON CONFLICT (auth_user_id) DO NOTHING
	`, adminID, adminID); err != nil {
		return nil, err
	}

	campaignID := fmt.Sprintf("camp-%d", time.Now().UnixNano())
	if _, err := tx.Exec(`
		INSERT INTO notification_campaigns (id, campaign_type, created_by_admin_id, status)
		VALUES ($1, $2, $3, 'draft')
	`, campaignID, input.CampaignType, adminID); err != nil {
		return nil, err
	}

	for index, variant := range input.MessageVariants {
		variantID := fmt.Sprintf("%s-msg-%03d", campaignID, index+1)
		if _, err := tx.Exec(`
			INSERT INTO notification_message_variants (id, campaign_id, language, title, body)
			VALUES ($1, $2, $3, $4, $5)
		`, variantID, campaignID, variant.Language, variant.Title, variant.Body); err != nil {
			return nil, err
		}
	}

	for index, productID := range input.ProductIDs {
		itemID := fmt.Sprintf("%s-item-%03d", campaignID, index+1)
		if _, err := tx.Exec(`
			INSERT INTO notification_campaign_items (id, campaign_id, product_id, sort_order)
			VALUES ($1, $2, $3, $4)
		`, itemID, campaignID, productID, index); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &Campaign{
		ID:              campaignID,
		CampaignType:    input.CampaignType,
		Status:          "draft",
		MessageVariants: input.MessageVariants,
		ProductIDs:      input.ProductIDs,
	}, nil
}

func (r *PostgresRepository) MarkSent(campaignID string) (*Campaign, error) {
	result, err := r.db.Exec(`
		UPDATE notification_campaigns
		SET status = 'sent', sent_at = NOW()
		WHERE id = $1
	`, campaignID)
	if err != nil {
		return nil, err
	}
	if rowsAffected, _ := result.RowsAffected(); rowsAffected == 0 {
		return nil, ErrCampaignNotFound
	}

	return &Campaign{
		ID:     campaignID,
		Status: "sent",
	}, nil
}

