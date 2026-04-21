package auth

import (
	"os"
	"strings"
)

// StaticVerifier is a temporary development-safe verifier used until the real
// Supabase-backed verifier is wired in.
type StaticVerifier struct{}

func NewStaticVerifier() *StaticVerifier {
	return &StaticVerifier{}
}

func (v *StaticVerifier) VerifyBearerToken(token string) (*Session, error) {
	stageBuyerToken := os.Getenv("STAGE_BUYER_BEARER_TOKEN")
	if stageBuyerToken != "" && token == stageBuyerToken {
		return &Session{
			UserID: "buyer-stage-001",
			Role:   RoleBuyer,
			Email:  "buyer-stage@example.com",
		}, nil
	}

	founderAdminToken := os.Getenv("FOUNDER_ADMIN_BEARER_TOKEN")
	if founderAdminToken != "" && token == founderAdminToken {
		return &Session{
			UserID: "founder-admin-001",
			Role:   RoleAdmin,
			Email:  "founder@pet-slay.local",
		}, nil
	}

	stageAdminToken := os.Getenv("STAGE_ADMIN_BEARER_TOKEN")
	if stageAdminToken != "" && token == stageAdminToken {
		return &Session{
			UserID: "admin-stage-001",
			Role:   RoleAdmin,
			Email:  "admin-stage@example.com",
		}, nil
	}

	if !devTokensAllowed() {
		return nil, ErrInvalidToken
	}

	switch token {
	case "dev-buyer-token":
		return &Session{
			UserID: "buyer-dev-001",
			Role:   RoleBuyer,
			Email:  "buyer@example.com",
		}, nil
	case "dev-admin-token":
		return &Session{
			UserID: "admin-dev-001",
			Role:   RoleAdmin,
			Email:  "admin@example.com",
		}, nil
	default:
		return nil, ErrInvalidToken
	}
}

func devTokensAllowed() bool {
	if strings.EqualFold(os.Getenv("ALLOW_DEV_TOKENS"), "true") {
		return true
	}

	switch strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV"))) {
	case "", "local", "dev", "development", "test":
		return true
	default:
		return false
	}
}
