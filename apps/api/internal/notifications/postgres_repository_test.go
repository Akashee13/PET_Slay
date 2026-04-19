package notifications

import (
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestPostgresRepositoryRegistersDeviceToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	input := RegisterDeviceTokenInput{
		BuyerID:  "buyer-dev-001",
		Provider: "expo",
		Token:    "ExponentPushToken[test]",
		Platform: "android",
	}

	mock.ExpectExec("INSERT INTO reseller_buyers").
		WithArgs("buyer-dev-001", "buyer-dev-001").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(regexp.QuoteMeta(upsertDeviceTokenSQL)).
		WithArgs(sqlmock.AnyArg(), "buyer-dev-001", "expo", "ExponentPushToken[test]", "android").
		WillReturnRows(sqlmock.NewRows([]string{"id", "buyer_id", "provider", "token", "platform", "status"}).
			AddRow("dtok-001", "buyer-dev-001", "expo", "ExponentPushToken[test]", "android", "active"))

	token, created, err := repo.RegisterDeviceToken(input)
	if err != nil {
		t.Fatalf("register token: %v", err)
	}

	if !created {
		t.Fatalf("expected repository to report created token")
	}
	if token.ID != "dtok-001" {
		t.Fatalf("expected dtok-001, got %s", token.ID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresRepositoryCreatesCampaignTransactionally(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	input := CreateCampaignInput{
		CampaignType: "new_arrival",
		MessageVariants: []MessageVariant{
			{Language: "english", Title: "Fresh drop", Body: "New styles live"},
		},
		ProductIDs: []string{"prod-western-001"},
	}

	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO admin_operators").
		WithArgs("admin-dev-001", "admin-dev-001").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO notification_campaigns").
		WithArgs(sqlmock.AnyArg(), "new_arrival", "admin-dev-001").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO notification_message_variants").
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), "english", "Fresh drop", "New styles live").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO notification_campaign_items").
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), "prod-western-001", 0).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	campaign, err := repo.Create(input)
	if err != nil {
		t.Fatalf("create campaign: %v", err)
	}

	if campaign.Status != "draft" {
		t.Fatalf("expected draft status, got %s", campaign.Status)
	}
	if len(campaign.ProductIDs) != 1 {
		t.Fatalf("expected one product id")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

