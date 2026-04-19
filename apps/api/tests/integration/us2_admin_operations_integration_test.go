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

	createReq := httptest.NewRequest(http.MethodPost, "/v1/admin/products", testutil.JSONBody(`{"title":"Stage Product","category":"western","baseWholesalePrice":999,"moq":3}`))
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

	updateReq := httptest.NewRequest(http.MethodPatch, "/v1/admin/products/"+productID, testutil.JSONBody(`{"availabilityStatus":"low_stock","isNewArrival":true}`))
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
