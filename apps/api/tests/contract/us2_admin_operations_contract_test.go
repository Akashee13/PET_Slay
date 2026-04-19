package contract_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

func TestAdminProductsCreateRequiresAdminAuth(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/products", testutil.JSONBody(`{"title":"Stage Product","category":"western","baseWholesalePrice":999,"moq":3,"imageUrls":["https://cdn.example.com/a.jpg"]}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAdminProductsCreateContract(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/products", testutil.JSONBody(`{"title":"Stage Product","category":"western","baseWholesalePrice":999,"moq":3,"imageUrls":["https://cdn.example.com/a.jpg","https://cdn.example.com/b.jpg"]}`))
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["id"] == nil {
		t.Fatalf("expected product id")
	}

	imageURLs, ok := payload["imageUrls"].([]any)
	if !ok || len(imageURLs) != 2 {
		t.Fatalf("expected image urls in contract response, got %v", payload["imageUrls"])
	}
}

func TestAdminProductsListContract(t *testing.T) {
	handler := testutil.NewHandler()

	seedReq := httptest.NewRequest(http.MethodPost, "/v1/admin/products", testutil.JSONBody(`{"title":"Listed Product","category":"western","baseWholesalePrice":899,"moq":2,"imageUrls":["https://cdn.example.com/list.jpg"]}`))
	seedReq.Header.Set("Authorization", "Bearer dev-admin-token")
	seedReq.Header.Set("Content-Type", "application/json")
	seedRec := httptest.NewRecorder()
	handler.ServeHTTP(seedRec, seedReq)

	req := httptest.NewRequest(http.MethodGet, "/v1/admin/products", nil)
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload struct {
		Items []map[string]any `json:"items"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(payload.Items) == 0 {
		t.Fatalf("expected products list items")
	}
}

func TestAdminOrdersListContract(t *testing.T) {
	handler := testutil.NewHandler()

	// Seed one buyer order first.
	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	req := httptest.NewRequest(http.MethodGet, "/v1/admin/orders", nil)
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload struct {
		Items []map[string]any `json:"items"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(payload.Items) == 0 {
		t.Fatalf("expected admin order queue items")
	}
}

func TestAdminOrderStatusUpdateContract(t *testing.T) {
	handler := testutil.NewHandler()

	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	var created map[string]any
	if err := json.Unmarshal(createOrderRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode created order: %v", err)
	}
	orderID, _ := created["id"].(string)

	req := httptest.NewRequest(http.MethodPatch, "/v1/admin/orders/"+orderID, testutil.JSONBody(`{"status":"confirmed"}`))
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["status"] != "confirmed" {
		t.Fatalf("expected confirmed status, got %v", payload["status"])
	}
}
