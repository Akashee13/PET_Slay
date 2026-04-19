package orders

import (
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestPostgresRepositorySavesOrderTransactionally(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	input := CreateOrderRequest{
		BuyerID:         "buyer-dev-001",
		ShippingAddress: map[string]interface{}{"city": "Delhi"},
		Notes:           "fast dispatch",
	}
	order := Order{
		ID:          "order-001",
		Status:      "pending",
		TotalAmount: 3196,
		Items: []OrderLineItem{
			{
				ProductID: "prod-western-001",
				VariantID: "var-western-001-s",
				Quantity:  4,
				UnitPrice: 799,
				LineTotal: 3196,
			},
		},
	}

	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO reseller_buyers").
		WithArgs("buyer-dev-001", "buyer-dev-001").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO orders").
		WithArgs("order-001", "buyer-dev-001", "PS-order-001", "pending", 3196.0, 3196.0, sqlmock.AnyArg(), "fast dispatch").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO order_items").
		WithArgs(sqlmock.AnyArg(), "order-001", "prod-western-001", "var-western-001-s", 4, 799.0, 3196.0).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	if err := repo.Save(input, order); err != nil {
		t.Fatalf("save order: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresRepositoryGetsOrderWithItems(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	mock.ExpectQuery(regexp.QuoteMeta(getOrderSQL)).
		WithArgs("order-001").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status", "total_amount"}).AddRow("order-001", "pending", 3196.0))
	mock.ExpectQuery(regexp.QuoteMeta(listOrderItemsSQL)).
		WithArgs("order-001").
		WillReturnRows(sqlmock.NewRows([]string{"product_id", "product_variant_id", "quantity", "unit_price", "line_total"}).
			AddRow("prod-western-001", "var-western-001-s", 4, 799.0, 3196.0))

	order, err := repo.Get("order-001")
	if err != nil {
		t.Fatalf("get order: %v", err)
	}

	if order.ID != "order-001" {
		t.Fatalf("expected order-001, got %s", order.ID)
	}
	if len(order.Items) != 1 {
		t.Fatalf("expected one item, got %d", len(order.Items))
	}
	if order.RefundPolicy.DefaultMode != "store_credit" {
		t.Fatalf("expected store credit refund policy")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

