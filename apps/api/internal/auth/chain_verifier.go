package auth

type ChainVerifier struct {
	verifiers []Verifier
}

func NewChainVerifier(verifiers ...Verifier) *ChainVerifier {
	filtered := make([]Verifier, 0, len(verifiers))
	for _, verifier := range verifiers {
		if verifier != nil {
			filtered = append(filtered, verifier)
		}
	}

	return &ChainVerifier{verifiers: filtered}
}

func (v *ChainVerifier) VerifyBearerToken(token string) (*Session, error) {
	var lastErr error
	for _, verifier := range v.verifiers {
		session, err := verifier.VerifyBearerToken(token)
		if err == nil {
			return session, nil
		}
		lastErr = err
	}

	if lastErr == nil {
		return nil, ErrInvalidToken
	}

	return nil, lastErr
}
