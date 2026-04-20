package auth

import "testing"

func TestStaticVerifierRejectsDevTokensInStage(t *testing.T) {
	t.Setenv("APP_ENV", "stage")

	verifier := NewStaticVerifier()
	if _, err := verifier.VerifyBearerToken("dev-admin-token"); err != ErrInvalidToken {
		t.Fatalf("expected dev admin token to be rejected in stage, got %v", err)
	}
	if _, err := verifier.VerifyBearerToken("dev-buyer-token"); err != ErrInvalidToken {
		t.Fatalf("expected dev buyer token to be rejected in stage, got %v", err)
	}
}

func TestStaticVerifierAllowsExplicitStageAdminToken(t *testing.T) {
	t.Setenv("APP_ENV", "stage")
	t.Setenv("STAGE_ADMIN_BEARER_TOKEN", "stage-admin-secret")

	verifier := NewStaticVerifier()
	session, err := verifier.VerifyBearerToken("stage-admin-secret")
	if err != nil {
		t.Fatalf("expected stage admin token to pass: %v", err)
	}
	if session.Role != RoleAdmin {
		t.Fatalf("expected admin role, got %s", session.Role)
	}
}

func TestStaticVerifierAllowsFounderAdminTokenInStage(t *testing.T) {
	t.Setenv("APP_ENV", "stage")
	t.Setenv("FOUNDER_ADMIN_BEARER_TOKEN", "founder-admin-secret")

	verifier := NewStaticVerifier()
	session, err := verifier.VerifyBearerToken("founder-admin-secret")
	if err != nil {
		t.Fatalf("expected founder admin token to pass: %v", err)
	}
	if session.Role != RoleAdmin {
		t.Fatalf("expected admin role, got %s", session.Role)
	}
	if session.UserID != "founder-admin-001" {
		t.Fatalf("expected founder admin user id, got %s", session.UserID)
	}
}

func TestStaticVerifierAllowsDevTokensLocally(t *testing.T) {
	t.Setenv("APP_ENV", "local")

	verifier := NewStaticVerifier()
	session, err := verifier.VerifyBearerToken("dev-buyer-token")
	if err != nil {
		t.Fatalf("expected local dev buyer token to pass: %v", err)
	}
	if session.Role != RoleBuyer {
		t.Fatalf("expected buyer role, got %s", session.Role)
	}
}
