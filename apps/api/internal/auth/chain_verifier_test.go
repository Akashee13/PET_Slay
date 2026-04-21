package auth

import "testing"

type stubVerifier struct {
	session *Session
	err     error
}

func (s stubVerifier) VerifyBearerToken(_ string) (*Session, error) {
	return s.session, s.err
}

func TestChainVerifierUsesFirstSuccessfulVerifier(t *testing.T) {
	verifier := NewChainVerifier(
		stubVerifier{err: ErrInvalidToken},
		stubVerifier{session: &Session{UserID: "buyer-123", Role: RoleBuyer, Email: "buyer@example.com"}},
	)

	session, err := verifier.VerifyBearerToken("token")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if session.UserID != "buyer-123" {
		t.Fatalf("expected buyer-123, got %s", session.UserID)
	}
}

func TestChainVerifierReturnsInvalidWhenAllFail(t *testing.T) {
	verifier := NewChainVerifier(
		stubVerifier{err: ErrInvalidToken},
		stubVerifier{err: ErrInvalidToken},
	)

	if _, err := verifier.VerifyBearerToken("token"); err != ErrInvalidToken {
		t.Fatalf("expected invalid token, got %v", err)
	}
}
