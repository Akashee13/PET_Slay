package refunds

import (
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestPostgresRepositoryDefaultsDecisionToStoreCredit(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	input := UpdateDecisionInput{
		Status:     "approved",
		ReasonCode: "customer_request",
	}

	mock.ExpectQuery(regexp.QuoteMeta(upsertRefundDecisionSQL)).
		WithArgs("refund-001", "order-001", "buyer-dev-001", "store_credit", "customer_request", "", "approved").
		WillReturnRows(sqlmock.NewRows([]string{"id", "order_id", "buyer_id", "status", "decision_type", "reason_code", "admin_notes"}).
			AddRow("refund-001", "order-001", "buyer-dev-001", "approved", "store_credit", "customer_request", ""))

	decision, err := repo.Update("refund-001", input)
	if err != nil {
		t.Fatalf("update refund: %v", err)
	}

	if decision.DecisionType != "store_credit" {
		t.Fatalf("expected store_credit, got %s", decision.DecisionType)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresRepositoryAllowsPaymentSourceOverride(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	input := UpdateDecisionInput{
		Status:       "approved",
		DecisionType: "payment_source",
		ReasonCode:   "quality_issue",
		AdminNotes:   "Approved exception",
	}

	mock.ExpectQuery(regexp.QuoteMeta(upsertRefundDecisionSQL)).
		WithArgs("refund-002", "order-001", "buyer-dev-001", "payment_source", "quality_issue", "Approved exception", "approved").
		WillReturnRows(sqlmock.NewRows([]string{"id", "order_id", "buyer_id", "status", "decision_type", "reason_code", "admin_notes"}).
			AddRow("refund-002", "order-001", "buyer-dev-001", "approved", "payment_source", "quality_issue", "Approved exception"))

	decision, err := repo.Update("refund-002", input)
	if err != nil {
		t.Fatalf("update refund: %v", err)
	}

	if decision.DecisionType != "payment_source" {
		t.Fatalf("expected payment_source, got %s", decision.DecisionType)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
