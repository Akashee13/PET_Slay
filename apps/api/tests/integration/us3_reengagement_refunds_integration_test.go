package integration_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

func TestAdminCanCreateAndSendCampaign(t *testing.T) {
	handler := testutil.NewHandler()

	createReq := httptest.NewRequest(http.MethodPost, "/v1/admin/notification-campaigns", testutil.JSONBody(`{"campaignType":"new_arrival","messageVariants":[{"language":"english","title":"Fresh drop","body":"New styles live"},{"language":"hinglish","title":"Fresh drop","body":"New styles ab live hain"}],"productIds":["prod-western-001"]}`))
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

	campaignID, _ := created["id"].(string)
	if campaignID == "" {
		t.Fatalf("expected campaign id")
	}

	sendReq := httptest.NewRequest(http.MethodPost, "/v1/admin/notification-campaigns/"+campaignID+"/send", nil)
	sendReq.Header.Set("Authorization", "Bearer dev-admin-token")
	sendRec := httptest.NewRecorder()
	handler.ServeHTTP(sendRec, sendReq)

	if sendRec.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d body=%s", sendRec.Code, sendRec.Body.String())
	}
}

func TestBuyerCanRegisterPushTokenIdempotently(t *testing.T) {
	handler := testutil.NewHandler()

	body := `{"provider":"expo","token":"ExponentPushToken[stable-device]","platform":"ios"}`

	firstReq := httptest.NewRequest(http.MethodPost, "/v1/buyers/device-tokens", testutil.JSONBody(body))
	firstReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	firstReq.Header.Set("Content-Type", "application/json")
	firstRec := httptest.NewRecorder()
	handler.ServeHTTP(firstRec, firstReq)

	if firstRec.Code != http.StatusCreated {
		t.Fatalf("expected first registration 201, got %d body=%s", firstRec.Code, firstRec.Body.String())
	}

	secondReq := httptest.NewRequest(http.MethodPost, "/v1/buyers/device-tokens", testutil.JSONBody(body))
	secondReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	secondReq.Header.Set("Content-Type", "application/json")
	secondRec := httptest.NewRecorder()
	handler.ServeHTTP(secondRec, secondReq)

	if secondRec.Code != http.StatusOK {
		t.Fatalf("expected repeat registration 200, got %d body=%s", secondRec.Code, secondRec.Body.String())
	}

	var payload map[string]any
	if err := json.Unmarshal(secondRec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode token response: %v", err)
	}

	if payload["token"] != "ExponentPushToken[stable-device]" {
		t.Fatalf("expected stable token, got %v", payload["token"])
	}
	if payload["platform"] != "ios" {
		t.Fatalf("expected ios platform, got %v", payload["platform"])
	}
}

func TestAdminRefundDecisionFlow(t *testing.T) {
	handler := testutil.NewHandler()

	createOrderReq := httptest.NewRequest(http.MethodPost, "/v1/orders", testutil.JSONBody(`{"items":[{"productVariantId":"var-western-001-s","quantity":4}],"shippingAddress":{"city":"Delhi"}}`))
	createOrderReq.Header.Set("Authorization", "Bearer dev-buyer-token")
	createOrderReq.Header.Set("Content-Type", "application/json")
	createOrderRec := httptest.NewRecorder()
	handler.ServeHTTP(createOrderRec, createOrderReq)

	if createOrderRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", createOrderRec.Code, createOrderRec.Body.String())
	}

	req := httptest.NewRequest(http.MethodPatch, "/v1/admin/refunds/refund-001", testutil.JSONBody(`{"status":"approved","decisionType":"store_credit","reasonCode":"customer_request"}`))
	req.Header.Set("Authorization", "Bearer dev-admin-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode refund response: %v", err)
	}

	if payload["status"] != "approved" {
		t.Fatalf("expected approved status, got %v", payload["status"])
	}
	if payload["decisionType"] != "store_credit" {
		t.Fatalf("expected store_credit decision, got %v", payload["decisionType"])
	}
}
