package catalog

import (
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestPostgresRepositoryListsProductsWithFilters(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	visibleUntil := time.Now().UTC().Add(60 * 24 * time.Hour)
	mock.ExpectQuery(regexp.QuoteMeta(listProductsSQL)).
		WithArgs("western", "new_arrivals").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "category", "base_wholesale_price", "moq", "availability_status", "is_new_arrival", "media_cover_url", "media_urls", "listing_status", "visible_until",
		}).AddRow("prod-001", "Floral Co-ord Set", "western", 799.00, 4, "in_stock", true, "https://example.com/floral.jpg", []byte(`["https://example.com/floral-1.jpg","https://example.com/floral-2.jpg"]`), "listed", visibleUntil))

	items, err := repo.List("western", "new_arrivals")
	if err != nil {
		t.Fatalf("list products: %v", err)
	}

	if len(items) != 1 {
		t.Fatalf("expected 1 product, got %d", len(items))
	}
	if items[0].ID != "prod-001" {
		t.Fatalf("expected prod-001, got %s", items[0].ID)
	}
	if items[0].BaseWholesalePrice != 799 {
		t.Fatalf("expected price 799, got %f", items[0].BaseWholesalePrice)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresRepositoryGetsProductDetailWithVariants(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	visibleUntil := time.Now().UTC().Add(60 * 24 * time.Hour)
	mock.ExpectQuery(regexp.QuoteMeta(getProductSQL)).
		WithArgs("prod-001").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "category", "base_wholesale_price", "moq", "availability_status", "is_new_arrival", "media_cover_url", "media_urls", "listing_status", "visible_until", "description", "measurement_chart",
		}).AddRow("prod-001", "Floral Co-ord Set", "western", 799.00, 4, "in_stock", true, "https://example.com/floral.jpg", []byte(`["https://example.com/floral-1.jpg"]`), "listed", visibleUntil, "Fresh western style", []byte(`{"S":"34"}`)))
	mock.ExpectQuery(regexp.QuoteMeta(listVariantsSQL)).
		WithArgs("prod-001").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "size_label", "color_label", "availability_status",
		}).AddRow("var-001-s", "S", "Blue", "in_stock"))

	product, err := repo.Get("prod-001")
	if err != nil {
		t.Fatalf("get product: %v", err)
	}

	if product.ID != "prod-001" {
		t.Fatalf("expected prod-001, got %s", product.ID)
	}
	if len(product.Variants) != 1 {
		t.Fatalf("expected 1 variant, got %d", len(product.Variants))
	}
	if product.SizeChart["S"] != "34" {
		t.Fatalf("expected size chart S=34, got %v", product.SizeChart["S"])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestPostgresRepositoryFindsProductByVariantID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("open sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	visibleUntil := time.Now().UTC().Add(60 * 24 * time.Hour)
	mock.ExpectQuery(regexp.QuoteMeta(findByVariantSQL)).
		WithArgs("var-001-s").
		WillReturnRows(sqlmock.NewRows([]string{
			"product_id", "title", "category", "base_wholesale_price", "moq", "product_availability_status", "is_new_arrival", "media_cover_url", "listing_status", "visible_until", "variant_id", "size_label", "color_label", "variant_availability_status",
		}).AddRow("prod-001", "Floral Co-ord Set", "western", 799.00, 4, "in_stock", true, "https://example.com/floral.jpg", "listed", visibleUntil, "var-001-s", "S", "Blue", "in_stock"))

	product, variant, err := repo.FindByVariantID("var-001-s")
	if err != nil {
		t.Fatalf("find by variant: %v", err)
	}

	if product.ID != "prod-001" {
		t.Fatalf("expected product prod-001, got %s", product.ID)
	}
	if variant.ID != "var-001-s" {
		t.Fatalf("expected variant var-001-s, got %s", variant.ID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
