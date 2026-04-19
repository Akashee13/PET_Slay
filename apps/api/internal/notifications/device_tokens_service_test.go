package notifications

import "testing"

func TestDeviceTokenServiceRegistersAndUpdatesTokenIdempotently(t *testing.T) {
	service := NewDeviceTokenService()
	input := RegisterDeviceTokenInput{
		BuyerID:  "buyer-dev-001",
		Provider: "expo",
		Token:    "ExponentPushToken[test]",
		Platform: "android",
	}

	first, created, err := service.RegisterDeviceToken(input)
	if err != nil {
		t.Fatalf("register first token: %v", err)
	}
	if !created {
		t.Fatal("expected first registration to create token")
	}
	if first.Status != "active" {
		t.Fatalf("expected active status, got %s", first.Status)
	}

	second, created, err := service.RegisterDeviceToken(input)
	if err != nil {
		t.Fatalf("register second token: %v", err)
	}
	if created {
		t.Fatal("expected repeated registration to update existing token")
	}
	if second.ID != first.ID {
		t.Fatalf("expected same token ID, got %s and %s", first.ID, second.ID)
	}
}

func TestDeviceTokenServiceReadinessReflectsRegistration(t *testing.T) {
	service := NewDeviceTokenService()

	before := service.BuyerReadiness("buyer-dev-001")
	if before.Ready {
		t.Fatal("expected buyer to start as not ready")
	}
	if before.ActiveTokenCount != 0 {
		t.Fatalf("expected zero tokens, got %d", before.ActiveTokenCount)
	}

	_, _, err := service.RegisterDeviceToken(RegisterDeviceTokenInput{
		BuyerID:  "buyer-dev-001",
		Provider: "expo",
		Token:    "ExponentPushToken[test]",
		Platform: "ios",
	})
	if err != nil {
		t.Fatalf("register token: %v", err)
	}

	after := service.BuyerReadiness("buyer-dev-001")
	if !after.Ready {
		t.Fatal("expected buyer to be notification-ready after registration")
	}
	if after.ActiveTokenCount != 1 {
		t.Fatalf("expected one active token, got %d", after.ActiveTokenCount)
	}
}

func TestDeviceTokenServiceRejectsInvalidPayload(t *testing.T) {
	service := NewDeviceTokenService()

	_, _, err := service.RegisterDeviceToken(RegisterDeviceTokenInput{
		BuyerID: "buyer-dev-001",
		Token:   "ExponentPushToken[test]",
	})
	if err == nil {
		t.Fatal("expected invalid token payload error")
	}
	if err != ErrInvalidDeviceToken {
		t.Fatalf("expected ErrInvalidDeviceToken, got %v", err)
	}
}
