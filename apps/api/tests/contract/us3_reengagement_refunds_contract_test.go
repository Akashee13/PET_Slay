package contract_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

func TestAdminNotificationCampaignCreateRequiresAdminAuth(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/notification-campaigns", testutil.JSONBody(`{"campaignType":"new_arrival","messageVariants":[{"language":"english","title":"Fresh wholesale drop","body":"New styles are live now with fast dispatch for resellers."}],"productIds":["prod-western-001"]}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestBuyerDeviceTokenRegistrationRequiresBuyerAuth(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/buyers/device-tokens", testutil.JSONBody(`{"provider":"expo","token":"ExponentPushToken[test]","platform":"android"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestBuyerDeviceTokenRegistrationContract(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/buyers/device-tokens", testutil.JSONBody(`{"provider":"expo","token":"ExponentPushToken[test]","platform":"android"}`))
	req.Header.Set("Authorization", "Bearer dev-buyer-token")
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

	if payload["buyerId"] != "buyer-dev-001" {
		t.Fatalf("expected buyer id buyer-dev-001, got %v", payload["buyerId"])
	}
	if payload["status"] != "active" {
		t.Fatalf("expected active token status, got %v", payload["status"])
	}
}

func TestAdminNotificationCampaignCreateContract(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/notification-campaigns", testutil.JSONBody(`{"campaignType":"new_arrival","messageVariants":[{"language":"english","title":"Fresh wholesale drop","body":"New styles are live now with fast dispatch for resellers."}],"productIds":["prod-western-001"]}`))
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
		t.Fatalf("expected campaign id")
	}
}

func TestAdminNotificationCampaignRequiresCatalogContext(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/notification-campaigns", testutil.JSONBody(`{"campaignType":"trending","messageVariants":[{"language":"english","title":"Trending styles live","body":"Fast-moving styles are available now for wholesale buyers."}],"productIds":[]}`))
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", rec.Code, rec.Body.String())
	}
}

func TestAdminNotificationCampaignRejectsEmptyLocalizedCopy(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/notification-campaigns", testutil.JSONBody(`{"campaignType":"new_arrival","messageVariants":[{"language":"hinglish","title":"","body":"New stock ab live hai"}],"productIds":["prod-western-001"]}`))
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", rec.Code, rec.Body.String())
	}
}

func TestAdminRefundDecisionUpdateContract(t *testing.T) {
	handler := testutil.NewHandler()

	// seed an order first
	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	req := httptest.NewRequest(http.MethodPatch, "/v1/admin/refunds/refund-001", testutil.JSONBody(`{"status":"approved","decisionType":"payment_source","reasonCode":"quality_issue"}`))
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

	if payload["decisionType"] != "payment_source" {
		t.Fatalf("expected decisionType payment_source, got %v", payload["decisionType"])
	}
}

func TestBuyerRefundVisibilityContract(t *testing.T) {
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

	refundReq := httptest.NewRequest(http.MethodPatch, "/v1/admin/refunds/refund-001", testutil.JSONBody(`{"orderId":"`+orderID+`","buyerId":"buyer-dev-001","status":"approved","decisionType":"store_credit","reasonCode":"customer_request"}`))
	refundReq.Header.Set("Authorization", "Bearer dev-admin-token")
	refundReq.Header.Set("Content-Type", "application/json")
	refundRec := httptest.NewRecorder()
	handler.ServeHTTP(refundRec, refundReq)

	req := httptest.NewRequest(http.MethodGet, "/v1/orders/"+orderID+"/refunds", nil)
	req.Header.Set("Authorization", "Bearer dev-buyer-token")
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
	if len(payload.Items) != 1 {
		t.Fatalf("expected one refund decision, got %d", len(payload.Items))
	}
	if payload.Items[0]["decisionType"] != "store_credit" {
		t.Fatalf("expected store_credit decision, got %v", payload.Items[0]["decisionType"])
	}
}
