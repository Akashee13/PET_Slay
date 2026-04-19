package auth

import "os"

// StaticVerifier is a temporary development-safe verifier used until the real
// Supabase-backed verifier is wired in.
type StaticVerifier struct{}

func NewStaticVerifier() *StaticVerifier {
	return &StaticVerifier{}
}

func (v *StaticVerifier) VerifyBearerToken(token string) (*Session, error) {
	stageAdminToken := os.Getenv("STAGE_ADMIN_BEARER_TOKEN")
	if stageAdminToken != "" && token == stageAdminToken {
		return &Session{
			UserID: "admin-stage-001",
			Role:   RoleAdmin,
			Email:  "admin-stage@example.com",
		}, nil
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
