package contract_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

func TestHealthContract(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["status"] != "ok" {
		t.Fatalf("expected status=ok, got %v", payload["status"])
	}
	if payload["service"] != "pet-slay-api" {
		t.Fatalf("expected service=pet-slay-api, got %v", payload["service"])
	}
}

func TestCurrentUserRequiresAuthorization(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestCatalogProductsContract(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/catalog/products", nil)
	req.Header.Set("Authorization", "Bearer dev-buyer-token")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var payload struct {
		Items []map[string]any `json:"items"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(payload.Items) == 0 {
		t.Fatalf("expected catalog items")
	}
	if payload.Items[0]["id"] == nil {
		t.Fatalf("expected product id in response")
	}
}

func TestOrderCreateContract(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	req.Header.Set("Authorization", "Bearer dev-buyer-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["id"] == nil {
		t.Fatalf("expected order id")
	}
	if payload["refundPolicy"] == nil {
		t.Fatalf("expected refund policy")
	}
}
