package integration_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

func TestAdminCanCreateAndUpdateProduct(t *testing.T) {
	handler := testutil.NewHandler()

	createReq := httptest.NewRequest(http.MethodPost, "/v1/admin/products", testutil.JSONBody(`{"title":"Stage Product","category":"western","baseWholesalePrice":999,"moq":3,"imageUrls":["https://cdn.example.com/a.jpg","https://cdn.example.com/b.jpg"]}`))
	createReq.Header.Set("Authorization", "Bearer dev-admin-token")
	createReq.Header.Set("Content-Type", "application/json")
	createRec := httptest.NewRecorder()
	handler.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", createRec.Code, createRec.Body.String())
	}

	var created map[string]any
	if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode create response: %v", err)
	}

	productID, _ := created["id"].(string)
	if productID == "" {
		t.Fatalf("expected product id")
	}

	createdImageURLs, ok := created["imageUrls"].([]any)
	if !ok || len(createdImageURLs) != 2 {
		t.Fatalf("expected 2 image urls, got %v", created["imageUrls"])
	}

	updateReq := httptest.NewRequest(http.MethodPatch, "/v1/admin/products/"+productID, testutil.JSONBody(`{"availabilityStatus":"low_stock","isNewArrival":true,"imageUrls":["https://cdn.example.com/c.jpg"]}`))
	updateReq.Header.Set("Authorization", "Bearer dev-admin-token")
	updateReq.Header.Set("Content-Type", "application/json")
	updateRec := httptest.NewRecorder()
	handler.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", updateRec.Code, updateRec.Body.String())
	}

	var updated map[string]any
	if err := json.Unmarshal(updateRec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode update response: %v", err)
	}

	if updated["availabilityStatus"] != "low_stock" {
		t.Fatalf("expected availabilityStatus low_stock, got %v", updated["availabilityStatus"])
	}

	updatedImageURLs, ok := updated["imageUrls"].([]any)
	if !ok || len(updatedImageURLs) != 1 {
		t.Fatalf("expected 1 image url after update, got %v", updated["imageUrls"])
	}
}

func TestAdminCanListProducts(t *testing.T) {
	handler := testutil.NewHandler()

	seedReq := httptest.NewRequest(http.MethodPost, "/v1/admin/products", testutil.JSONBody(`{"title":"Listed Product","category":"western","baseWholesalePrice":1099,"moq":2,"imageUrls":["https://cdn.example.com/listed.jpg"]}`))
	seedReq.Header.Set("Authorization", "Bearer dev-admin-token")
	seedReq.Header.Set("Content-Type", "application/json")
	seedRec := httptest.NewRecorder()
	handler.ServeHTTP(seedRec, seedReq)

	if seedRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", seedRec.Code, seedRec.Body.String())
	}

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
		t.Fatalf("expected at least one product")
	}
}

func TestAdminPreflightAllowsStageAdminOrigin(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodOptions, "/v1/admin/products", nil)
	req.Header.Set("Origin", "https://pet-slay-admin-stage-j67sekma7a-el.a.run.app")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for preflight, got %d body=%s", rec.Code, rec.Body.String())
	}

	if rec.Header().Get("Access-Control-Allow-Origin") != "https://pet-slay-admin-stage-j67sekma7a-el.a.run.app" {
		t.Fatalf("expected allow origin header for stage admin app, got %q", rec.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestAdminOrdersResponseIncludesCORSHeadersForStageOrigin(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/admin/orders", nil)
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	req.Header.Set("Origin", "https://pet-slay-admin-stage-j67sekma7a-el.a.run.app")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	if rec.Header().Get("Access-Control-Allow-Origin") != "https://pet-slay-admin-stage-j67sekma7a-el.a.run.app" {
		t.Fatalf("expected allow origin header for stage admin app, got %q", rec.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestAdminOrderQueueIncludesBuyerOrders(t *testing.T) {
	handler := testutil.NewHandler()

	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	if createOrderRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", createOrderRec.Code, createOrderRec.Body.String())
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/admin/orders", nil)
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload struct {
		Items []struct {
			ID string `json:"id"`
		} `json:"items"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode order queue: %v", err)
	}

	if len(payload.Items) == 0 {
		t.Fatalf("expected at least one order in admin queue")
	}
}

func TestAdminCanUpdateOrderStatus(t *testing.T) {
	handler := testutil.NewHandler()

	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	if createOrderRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", createOrderRec.Code, createOrderRec.Body.String())
	}

	var created map[string]any
	if err := json.Unmarshal(createOrderRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode created order: %v", err)
	}
	orderID, _ := created["id"].(string)

	updateReq := httptest.NewRequest(http.MethodPatch, "/v1/admin/orders/"+orderID, testutil.JSONBody(`{"status":"shipped"}`))
	updateReq.Header.Set("Authorization", "Bearer dev-admin-token")
	updateReq.Header.Set("Content-Type", "application/json")
	updateRec := httptest.NewRecorder()
	handler.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", updateRec.Code, updateRec.Body.String())
	}

	getReq := httptest.NewRequest(http.MethodGet, "/v1/orders/"+orderID, nil)
	getReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	getRec := httptest.NewRecorder()
	handler.ServeHTTP(getRec, getReq)

	var fetched struct {
		Status string `json:"status"`
	}
	if err := json.Unmarshal(getRec.Body.Bytes(), &fetched); err != nil {
		t.Fatalf("decode fetched order: %v", err)
	}

	if fetched.Status != "shipped" {
		t.Fatalf("expected shipped status, got %s", fetched.Status)
	}
}
