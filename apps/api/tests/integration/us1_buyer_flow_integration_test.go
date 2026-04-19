package integration_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

type buyerProfile struct {
	ID                string `json:"id"`
	Role              string `json:"role"`
	Email             string `json:"email"`
	PreferredLanguage string `json:"preferredLanguage"`
	BusinessName      string `json:"businessName"`
}

type catalogResponse struct {
	Items []struct {
		ID           string `json:"id"`
		MOQ          int    `json:"moq"`
		IsNewArrival bool   `json:"isNewArrival"`
	} `json:"items"`
}

type orderResponse struct {
	ID          string  `json:"id"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"totalAmount"`
	Items       []struct {
		ProductID string `json:"productId"`
		Quantity  int    `json:"quantity"`
	} `json:"items"`
	RefundPolicy struct {
		DefaultMode           string `json:"defaultMode"`
		AdminExceptionAllowed bool   `json:"adminExceptionAllowed"`
	} `json:"refundPolicy"`
}

func TestBuyerLanguagePreferenceRoundTrip(t *testing.T) {
	handler := testutil.NewHandler()

	beforeReq := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	beforeReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	beforeRec := httptest.NewRecorder()
	handler.ServeHTTP(beforeRec, beforeReq)

	var before buyerProfile
	if err := json.Unmarshal(beforeRec.Body.Bytes(), &before); err != nil {
		t.Fatalf("decode profile: %v", err)
	}

	if before.PreferredLanguage != "english" {
		t.Fatalf("expected default language english, got %s", before.PreferredLanguage)
	}

	updateReq := httptest.NewRequest(http.MethodPut, "/v1/buyers/preferences/language", testutil.JSONBody(`{"preferredLanguage":"hindi"}`))
	updateReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	updateReq.Header.Set("Content-Type", "application/json")
	updateRec := httptest.NewRecorder()
	handler.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", updateRec.Code)
	}

	var updated buyerProfile
	if err := json.Unmarshal(updateRec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode updated profile: %v", err)
	}

	if updated.PreferredLanguage != "hindi" {
		t.Fatalf("expected updated language hindi, got %s", updated.PreferredLanguage)
	}

	afterReq := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	afterReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	afterRec := httptest.NewRecorder()
	handler.ServeHTTP(afterRec, afterReq)

	var after buyerProfile
	if err := json.Unmarshal(afterRec.Body.Bytes(), &after); err != nil {
		t.Fatalf("decode final profile: %v", err)
	}

	if after.PreferredLanguage != "hindi" {
		t.Fatalf("expected persisted language hindi, got %s", after.PreferredLanguage)
	}
}

func TestCatalogFilterAndOrderJourney(t *testing.T) {
	handler := testutil.NewHandler()

	catalogReq := httptest.NewRequest(http.MethodGet, "/v1/catalog/products?collection=new_arrivals", nil)
	catalogReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	catalogRec := httptest.NewRecorder()
	handler.ServeHTTP(catalogRec, catalogReq)

	if catalogRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", catalogRec.Code)
	}

	var catalogPayload catalogResponse
	if err := json.Unmarshal(catalogRec.Body.Bytes(), &catalogPayload); err != nil {
		t.Fatalf("decode catalog: %v", err)
	}

	if len(catalogPayload.Items) != 1 {
		t.Fatalf("expected exactly one new arrival, got %d", len(catalogPayload.Items))
	}

	detailReq := httptest.NewRequest(http.MethodGet, "/v1/catalog/products/prod-western-001", nil)
	detailReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	detailRec := httptest.NewRecorder()
	handler.ServeHTTP(detailRec, detailReq)

	if detailRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", detailRec.Code)
	}

	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	if createOrderRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createOrderRec.Code)
	}

	var created orderResponse
	if err := json.Unmarshal(createOrderRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode created order: %v", err)
	}

	if created.ID == "" {
		t.Fatalf("expected created order id")
	}
	if created.RefundPolicy.DefaultMode != "store_credit" {
		t.Fatalf("expected default refund mode store_credit, got %s", created.RefundPolicy.DefaultMode)
	}

	getOrderReq := httptest.NewRequest(http.MethodGet, "/v1/orders/"+created.ID, nil)
	getOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	getOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(getOrderRec, getOrderReq)

	if getOrderRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", getOrderRec.Code)
	}

	var fetched orderResponse
	if err := json.Unmarshal(getOrderRec.Body.Bytes(), &fetched); err != nil {
		t.Fatalf("decode fetched order: %v", err)
	}

	if fetched.ID != created.ID {
		t.Fatalf("expected order id %s, got %s", created.ID, fetched.ID)
	}
	if len(fetched.Items) != 1 {
		t.Fatalf("expected one order item, got %d", len(fetched.Items))
	}
}

func TestOrderRejectsMOQViolation(t *testing.T) {
	handler := testutil.NewHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":1}],"shippingAddress":{"city":"Delhi"}}`))
	req.Header.Set("Authorization", "Bearer dev-buyer-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}
